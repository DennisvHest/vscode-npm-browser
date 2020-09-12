import * as vscode from 'vscode';
import { BrowserWebView } from './app/BrowserWebView';
import { NPMTerminal } from './app/NPMTerminal';
import { CommandTypes, ToastLevels, ValueCommand, VSCodeToastCommand, PackageJson, ResolvePrivatePackageCommand } from '../../../libs/shared/src';
import { DependencyTreeDataProvider } from './app/DependencyTreeDataProvider';
import { Subscription } from 'rxjs';
import { take} from 'rxjs/operators'
import * as path from 'path'
import * as cp from 'child_process'
import * as util from 'util'

let packageJsonSubscription: Subscription;
let packageJsonsSubscription: Subscription;
let openPackageDetailCommandRegistration: vscode.Disposable;

export function activate(context: vscode.ExtensionContext) {

	const npmTerminal = new NPMTerminal();
	let browser: BrowserWebView;

	const selectedPackageJson: PackageJson = context.workspaceState.get('selectedPackageJson');

	if (selectedPackageJson)
		npmTerminal.setPackageJson(selectedPackageJson);

	function reinitializeBrowser() {
		if (!browser || !browser.isOpen) {
			browser = new BrowserWebView(context, false);
		} else {
			browser.setActivePanel();
		}

		browser.onTerminalCommand = npmTerminal.runCommand;
		browser.onValueCommand = onValueCommand;
		browser.onVSCodeToastCommand = onVSCodeToastCommand;
		browser.onResolvePackageCommand = onResolvePackageCommand 

		npmTerminal.onCommandComplete = (command, success) => {
			if (command.type === CommandTypes.npmInstall)
				browser.sendCommand({ type: CommandTypes.npmInstallComplete });

			if (command.type === CommandTypes.npmUninstall)
				browser.sendCommand({ type: CommandTypes.npmUninstallComplete });

			if (!success)
				vscode.window.showErrorMessage("Something went wrong executing an NPM command. See the terminal window for details.")
		}

		npmTerminal.findPackageJsons().then(res => {
			if (res.length === 1 && (npmTerminal.packageJson as any).value == null) {
				npmTerminal.setPackageJson(res[0])
			}
		});
		npmTerminal.reloadPackageJson();
	}

	

	openPackageDetailCommandRegistration = vscode.commands.registerCommand('npm-browser.open-package-detail', (packageName: string) => {
		reinitializeBrowser();

		const command: ValueCommand = { type: CommandTypes.installedPackageSelected, value: packageName };
		browser.sendCommand(command);
	});

	const treeView = vscode.window.createTreeView("dependencies", {
		treeDataProvider: new DependencyTreeDataProvider(npmTerminal.packageJson, context)
	});

	treeView.onDidChangeVisibility(async (event) => {
		if (!event.visible)
			return;

		reinitializeBrowser();
	});

	function onValueCommand(command: ValueCommand) {
		npmTerminal.setPackageJson(command.value);
	}

	async function onResolvePackageCommand (command: ResolvePrivatePackageCommand) {
		const projectPackageJSON = await npmTerminal.packageJson.pipe(take(1)).toPromise()

		let packageJSON

		try {
			const result = await util.promisify(cp.exec)(`npm view ${JSON.stringify(command.packageId)} --json`, { cwd: path.dirname(projectPackageJSON.filePath) })
			packageJSON = JSON.parse(result.stdout)
		} catch(e) {
			console.error(`failed to resolve private package ${command.packageId}`)
			return
		}

		if (packageJSON && packageJSON.name != null) {
			const distTags = packageJSON['dist-tags']

			const packageValue = {
				name: packageJSON.name,
				description: packageJSON.description,
				readme: "", 
				distTags: distTags,
				versions: 
					packageJSON.versions
						.map(version => ({ 
							version, 
							distTags: Object.entries(distTags)
								.filter(([, tagVersion]) => version === tagVersion)
								.map(([tag])=> tag) 
						})),
				author: packageJSON['author'] ? packageJSON['author'] : null
			}

			browser.sendCommand({ type: CommandTypes.replyPrivatePackageResult, requestId: command.requestId, value: packageValue } as any)
		}
	}

	function onVSCodeToastCommand(command: VSCodeToastCommand) {
		switch (command.level) {
			case ToastLevels.error: vscode.window.showErrorMessage(command.message); break;
			case ToastLevels.info:
			default: vscode.window.showInformationMessage(command.message); break;
		}
	}

	this.packageJsonsSubscription = npmTerminal.packageJsons.subscribe(packageJsons => {
		context.workspaceState.update('packageJsons', packageJsons);

		if (browser && browser.isOpen) {
			const command: ValueCommand = { type: CommandTypes.packageJsonsUpdated, value: packageJsons };
			browser.sendCommand(command);
		}
	});

	this.packageJsonSubscription = npmTerminal.packageJson.subscribe(changedPackageJson => {
		context.workspaceState.update('selectedPackageJson', changedPackageJson);

		if (browser && browser.isOpen) {
			const command: ValueCommand = { type: CommandTypes.packageJsonUpdated, value: changedPackageJson };
			browser.sendCommand(command);
		}
	});

	npmTerminal.findPackageJsons();
	npmTerminal.reloadPackageJson();
}

export function deactivate() {
	if (packageJsonSubscription)
		packageJsonSubscription.unsubscribe();

	if (packageJsonsSubscription)
		packageJsonsSubscription.unsubscribe();

	openPackageDetailCommandRegistration.dispose();
}

