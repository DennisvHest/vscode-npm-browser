import * as vscode from 'vscode';
import { BrowserWebView } from './app/BrowserWebView';

export function activate(context: vscode.ExtensionContext) {

	const terminal = vscode.window.createTerminal('Install package');

	function runTerminalCommand(command: any) {
		terminal.show();
		terminal.sendText(command.command, true);
	}

	const disposable = vscode.commands.registerCommand('npmBrowser.open', () => {
		const browser = new BrowserWebView(context, runTerminalCommand, true);
	});

	//runTerminalCommand({ command: 'abcdefg'});

	//context.subscriptions.push(disposable);
}



export function deactivate() { }