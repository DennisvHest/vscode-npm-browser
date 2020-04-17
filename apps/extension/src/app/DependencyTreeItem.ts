import * as path from 'path';
import * as vscode from 'vscode';
import { TreeItem } from 'vscode';

export class DependencyTreeItem extends TreeItem {

    packageName: string;
    packageVersion: string;
    
    constructor(name: string, version: string, context: vscode.ExtensionContext) {
        super(`${name} (${version})`);

        this.packageName = name;
        this.packageVersion = version;

        this.command = {
            command: "npm-browser.open-package-detail",
            title: "Open package detail",
            arguments: [this.packageName]
        }

        this.iconPath = {
            light: vscode.Uri.file(path.join(context.extensionPath, '/apps/extension/src/assets', 'dependency-light.svg')),
            dark: vscode.Uri.file(path.join(context.extensionPath, '/apps/extension/src/assets', 'dependency-dark.svg'))
        };
    }
}