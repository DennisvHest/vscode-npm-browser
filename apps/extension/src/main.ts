import * as vscode from 'vscode';
import { BrowserWebView } from './app/BrowserWebView';
import { NPMTerminal } from './app/NPMTerminal';
import { CommandTypes, ToastLevels, ValueCommand, VSCodeToastCommand, PackageJson } from '../../../libs/shared/src';
import { DependencyTreeDataProvider } from './app/DependencyTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {

	const npmTerminal = new NPMTerminal();
	let browser: BrowserWebView;

	context.workspaceState.update('selectedPackageJson', null);

	const selectedPackageJson: PackageJson = context.workspaceState.get('selectedPackageJson');

	if (selectedPackageJson)
		npmTerminal.setPackageJson(selectedPackageJson);

	const treeView = vscode.window.createTreeView("dependencies", {
		treeDataProvider: new DependencyTreeDataProvider(npmTerminal.packageJson)
	});

	treeView.onDidChangeVisibility(async (event) => {
		if (!event.visible) {
			return;
		}

		context.workspaceState.update('packageJsons', await npmTerminal.findPackageJsons());

		if (!browser || !browser.isOpen)
			browser = new BrowserWebView(context, false);

		browser.onTerminalCommand = npmTerminal.runCommand;
		browser.onValueCommand = onValueCommand;
		browser.onVSCodeToastCommand = onVSCodeToastCommand;

		npmTerminal.onCommandComplete = command => {
			if (command.type === CommandTypes.npmInstall)
				browser.sendCommand({ type: CommandTypes.npmInstallComplete });

			if (command.type === CommandTypes.npmUninstall)
				browser.sendCommand({ type: CommandTypes.npmUninstallComplete });
		}

		npmTerminal.onPackageJsonChange = changedPackageJson => {
			context.workspaceState.update('selectedPackageJson', changedPackageJson);

			const command: ValueCommand = { type: CommandTypes.packageJsonUpdated, value: changedPackageJson };
			browser.sendCommand(command);
		}
	});

	function onValueCommand(command: ValueCommand) {
		npmTerminal.setPackageJson(command.value);
		context.workspaceState.update('selectedPackageJson', command.value);
	}

	function onVSCodeToastCommand(command: VSCodeToastCommand) {
		switch (command.level) {
			case ToastLevels.info:
			default: vscode.window.showInformationMessage(command.message); break;
		}
	}
}

export function deactivate() {

}

