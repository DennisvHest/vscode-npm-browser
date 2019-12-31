import * as vscode from 'vscode';
import { BrowserWebView } from './app/BrowserWebView';
import { NPMTerminal } from './app/NPMTerminal';
import { CommandTypes, ToastLevels, ValueCommand, VSCodeToastCommand } from '../../../libs/shared/src';

class DependencyTreeDataProvider implements vscode.TreeDataProvider<Object> {

	readonly onDidChangeTreeData: vscode.Event<Object> = new vscode.EventEmitter<Object>().event;

	getTreeItem(element: Object): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	getChildren(element?: Object): vscode.ProviderResult<Object[]> {
		return;
	}

	getParent?(element: Object): vscode.ProviderResult<Object> {
		return;
	}
}

export function activate(context: vscode.ExtensionContext) {

	const npmTerminal = new NPMTerminal();

	context.workspaceState.update('selectedPackageJson', null);

	const treeView = vscode.window.createTreeView("dependencies", {
		treeDataProvider: new DependencyTreeDataProvider()
	});

	treeView.onDidChangeVisibility(async (event) => {
		if (!event.visible)
			return;

		context.workspaceState.update('packageJsons', await npmTerminal.findPackageJsons());

		const browser = new BrowserWebView(context, false);

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

