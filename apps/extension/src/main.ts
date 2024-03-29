import * as vscode from 'vscode';
import { BrowserWebView } from './app/BrowserWebView';
import { NPMTerminal } from './app/NPMTerminal';
import { CommandTypes, ToastLevels, ValueCommand, VSCodeToastCommand, PackageJson } from '../../../libs/shared/src';
import { DependencyTreeDataProvider } from './app/DependencyTreeDataProvider';
import { Subscription } from 'rxjs';

let packageJsonSubscription: Subscription;
let packageJsonsSubscription: Subscription;

let openPackageDetailCommandRegistration: vscode.Disposable;
let updateAllPackagesCommandRegistration: vscode.Disposable;

export function activate(context: vscode.ExtensionContext) {

	const npmTerminal = new NPMTerminal();
	let browser: BrowserWebView;

	const selectedPackageJson: PackageJson = context.workspaceState.get('selectedPackageJson');

	if (selectedPackageJson)
		npmTerminal.setPackageJson(selectedPackageJson);

	function reinitializeBrowser(refreshUpdates = true) {
		if (!browser || !browser.isOpen) {
			browser = new BrowserWebView(context, false);
		} else {
			browser.setActivePanel();
		}

		browser.onTerminalCommand = npmTerminal.queueCommand;
		browser.onValueCommand = onValueCommand;
		browser.onVSCodeToastCommand = onVSCodeToastCommand;

		npmTerminal.onCommandComplete = (command, success, result) => {
			if (command.type === CommandTypes.npmInstall)
				browser.sendCommand({ type: CommandTypes.npmInstallComplete });

			if (command.type === CommandTypes.npmUninstall)
				browser.sendCommand({ type: CommandTypes.npmUninstallComplete });

			if (success) {
				if (command.type === CommandTypes.fetchPackage)
					browser.sendCommand({ type: CommandTypes.fetchPackageComplete, value: result } as ValueCommand);

				if (command.type === CommandTypes.npmOutdated)
					browser.sendCommand({ type: CommandTypes.npmOutdated, value: result } as ValueCommand);
			} else {
				vscode.window.showErrorMessage("Something went wrong executing an NPM command. See the terminal window for details.")
			}
		}

		npmTerminal.findPackageJsons();
		npmTerminal.reloadPackageJson(refreshUpdates);
	}

	openPackageDetailCommandRegistration = vscode.commands.registerCommand('npm-browser.open-package-detail', (packageName: string) => {
		reinitializeBrowser(false);

		const command: ValueCommand = { type: CommandTypes.installedPackageSelected, value: packageName };
		browser.sendCommand(command);
	});

	updateAllPackagesCommandRegistration = vscode.commands.registerCommand('npm-browser.update-all-packages', async () => {
		const response = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Are you sure you want to update all packages?' });

		if (response === 'Yes') {
			npmTerminal.updateAllPackages();
		}
	});

	const treeView = vscode.window.createTreeView("dependencies", {
		treeDataProvider: new DependencyTreeDataProvider(npmTerminal.packageJson, npmTerminal.packageUpdates, context)
	});

	treeView.onDidChangeVisibility(async (event) => {
		if (!event.visible)
			return;

		reinitializeBrowser();
	});

	function onValueCommand(command: ValueCommand) {
		npmTerminal.setPackageJson(command.value);
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
	updateAllPackagesCommandRegistration.dispose();
}

