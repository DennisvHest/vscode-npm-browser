import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { DependencyTreeItem } from './DependencyTreeItem';

export class DependencyGroupTreeItem extends TreeItem {
    
    constructor(name, public children: DependencyTreeItem[]) {
        super(name);

        this.collapsibleState = TreeItemCollapsibleState.Expanded;
    }
}