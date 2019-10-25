import * as vscode from 'vscode';
import { BrowserWebView } from './app/BrowserWebView';
import { NPMTerminal } from './app/NPMTerminal';
import { CommandTypes, ToastLevels, ValueCommand, VSCodeToastCommand } from '../../../libs/shared/src';

export function activate(context: vscode.ExtensionContext) {

	const npmTerminal = new NPMTerminal();

	context.workspaceState.update('selectedPackageJson', null);

	const disposable = vscode.commands.registerCommand('npmBrowser.open', async () => {

		context.workspaceState.update('packageJsons', await npmTerminal.findPackageJsons());

		const browser = new BrowserWebView(context, false);

		browser.onTerminalCommand = npmTerminal.runCommand;
		browser.onValueCommand = onValueCommand;
		browser.onVSCodeToastCommand = onVSCodeToastCommand;

		npmTerminal.onCommandComplete = command => {
			if (command.type === CommandTypes.npmInstall)
				browser.sendCommand({ type: CommandTypes.npmInstallComplete });
		}

		npmTerminal.onPackageJsonChange = changedPackageJson => {
			context.workspaceState.update('selectedPackageJson', changedPackageJson);
			
			const command: ValueCommand = { type: CommandTypes.packageJsonUpdated, value: changedPackageJson };
			browser.sendCommand(command);
		}
	});

	context.subscriptions.push(disposable);

	function onValueCommand(command: ValueCommand) {
		npmTerminal.packageJson = command.value;
		context.workspaceState.update('selectedPackageJson', command.value);
	}

	function onVSCodeToastCommand(command: VSCodeToastCommand) {
		switch (command.level) {
			case ToastLevels.info:
			default: vscode.window.showInformationMessage(command.message); break;
		}
	}
}

export function deactivate() { }

