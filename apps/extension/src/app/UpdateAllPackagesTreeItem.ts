import * as path from 'path';
import * as vscode from 'vscode';
import { TreeItem } from "vscode";

export class UpdateAllPackagesTreeItem extends TreeItem {

    constructor(context: vscode.ExtensionContext) {
        super('Update all packages');

        this.command = {
            command: "npm-browser.update-all-packages",
            title: `Update all packages`
        }

        this.iconPath = vscode.Uri.file(path.join(context.extensionPath, '/apps/extension/src/assets', `update-all.svg`));
    }
}