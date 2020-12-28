import { PackageUpdatesItem } from 'libs/shared/src';
import * as path from 'path';
import * as vscode from 'vscode';
import { TreeItem } from 'vscode';

export class DependencyTreeItem extends TreeItem {

    packageName: string;
    packageVersion: string;
    
    constructor(name: string, version: string, updates: PackageUpdatesItem, context: vscode.ExtensionContext) {
        super(`${name}`);

        const hasUpdate = updates && updates.hasUpdateInRange;

        this.description = `(${version}) ${hasUpdate ? `- Update (${updates.wanted}) available` : ''}`;
        this.tooltip = `${name} (${version}) ${hasUpdate ? `- Has a new version (${updates.wanted}) within the version range specified in the package.json` : ''}`

        this.packageName = name;
        this.packageVersion = version;

        this.command = {
            command: "npm-browser.open-package-detail",
            title: `Open package detail`,
            arguments: [this.packageName]
        }

        this.iconPath = {
            light: vscode.Uri.file(path.join(context.extensionPath, '/apps/extension/src/assets', `dependency-${hasUpdate ? 'update-' : ''}light.svg`)),
            dark: vscode.Uri.file(path.join(context.extensionPath, '/apps/extension/src/assets', `dependency-${hasUpdate ? 'update-' : ''}dark.svg`))
        };
    }
}