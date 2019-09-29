import * as vscode from 'vscode';
import { BrowserWebView } from './app/BrowserWebView';
import { NPMTerminal } from './app/NPMTerminal';

export function activate(context: vscode.ExtensionContext) {

	const npmTerminal = new NPMTerminal();

	const disposable = vscode.commands.registerCommand('npmBrowser.open', () => {
		const browser = new BrowserWebView(context, npmTerminal.runCommand, true);
	});

	context.subscriptions.push(disposable);
}



export function deactivate() { }