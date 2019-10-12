import * as vscode from 'vscode';
import { BrowserWebView } from './app/BrowserWebView';
import { NPMTerminal } from './app/NPMTerminal';
import { CommandTypes } from '../../../libs/shared/src';

export function activate(context: vscode.ExtensionContext) {

	const npmTerminal = new NPMTerminal();

	const disposable = vscode.commands.registerCommand('npmBrowser.open', () => {
		const browser = new BrowserWebView(context, npmTerminal.runCommand, true);

		npmTerminal.onCommandComplete = command => {
			if (command.type === CommandTypes.npmInstall)
				browser.sendCommand({ type: CommandTypes.npmInstallComplete });
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }