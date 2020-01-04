import * as path from 'path';
import * as vscode from 'vscode';
import { TreeItem } from 'vscode';

export class DependencyTreeItem extends TreeItem {
    
    constructor(name, version, context: vscode.ExtensionContext) {
        super(`${name} (${version})`);

        this.iconPath = {
            light: vscode.Uri.file(path.join(context.extensionPath, '/apps/extension/assets', 'dependency-light.svg')),
            dark: vscode.Uri.file(path.join(context.extensionPath, '/apps/extension/assets', 'dependency-dark.svg'))
        };
    }
}