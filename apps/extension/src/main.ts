import * as vscode from 'vscode';
import { BrowserWebView } from './app/BrowserWebView';
import { TerminalCommand } from '@npm-browser/shared';

export function activate(context: vscode.ExtensionContext) {

	const terminal = vscode.window.createTerminal('Install package');

	function runTerminalCommand(command: TerminalCommand) {
		terminal.show();
		terminal.sendText(command.command, true);
	}

	const disposable = vscode.commands.registerCommand('npmBrowser.open', () => {
		const browser = new BrowserWebView(context, runTerminalCommand, true);
	});

	context.subscriptions.push(disposable);
}



export function deactivate() { }