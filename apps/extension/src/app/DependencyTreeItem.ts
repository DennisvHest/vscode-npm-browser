import { TreeItem, TreeItemCollapsibleState } from 'vscode';

export class DependencyTreeItem extends TreeItem {
    
    constructor(name, version) {
        super(`${name} (${version})`);
    }
}