import * as vscode from 'vscode';
import { BrowserWebView } from './app/BrowserWebView';
import { NPMTerminal } from './app/NPMTerminal';
import { CommandTypes, ToastLevels, ValueCommand, VSCodeToastCommand, PackageJson } from '../../../libs/shared/src';
import { DependencyTreeDataProvider } from './app/DependencyTreeDataProvider';
import { Subscription } from 'rxjs';

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

		npmTerminal.onCommandComplete = (command, success, result) => {
			if (command.type === CommandTypes.npmInstall)
				browser.sendCommand({ type: CommandTypes.npmInstallComplete });

			if (command.type === CommandTypes.npmUninstall)
				browser.sendCommand({ type: CommandTypes.npmUninstallComplete });

			if (success) {
				if (command.type === CommandTypes.fetchPackage)
					browser.sendCommand({ type: CommandTypes.fetchPackageComplete, value: result } as ValueCommand);
			} else {
				vscode.window.showErrorMessage("Something went wrong executing an NPM command. See the terminal window for details.")
			}
		}

		npmTerminal.findPackageJsons();
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

