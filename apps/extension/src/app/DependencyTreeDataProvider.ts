import * as vscode from 'vscode';
import { DependencyTreeItem } from './DependencyTreeItem';
import { DependencyGroupTreeItem } from './DependencyGroupTreeItem';
import { PackageJson } from 'libs/shared/src';
import { Observable, Subscription } from 'rxjs';

export class DependencyTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
    
    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

    private _packageJsonSubscription: Subscription;
    
    private _packageJson: PackageJson | undefined;

    constructor(private _packageJson$: Observable<PackageJson | undefined>, private _context: vscode.ExtensionContext) {
        this._packageJsonSubscription = this._packageJson$.subscribe(packageJson => {
            this._packageJson = packageJson;

            this._onDidChangeTreeData.fire();
        });
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
        if (!element) {
            let dependencies: DependencyTreeItem[] = [];
            let devDependencies: DependencyTreeItem[] = [];
            let optionalDependencies: DependencyTreeItem[] = [];

            if (this._packageJson) {
                dependencies = Object.keys(this._packageJson.dependencies ? this._packageJson.dependencies : {})
                    .map(packageName => new DependencyTreeItem(packageName, this._packageJson.dependencies[packageName], this._context));

                devDependencies = Object.keys(this._packageJson.devDependencies ? this._packageJson.devDependencies : {})
                    .map(packageName => new DependencyTreeItem(packageName, this._packageJson.devDependencies[packageName], this._context));

                optionalDependencies = Object.keys(this._packageJson.optionalDependencies ? this._packageJson.optionalDependencies : {})
                    .map(packageName => new DependencyTreeItem(packageName, this._packageJson.optionalDependencies[packageName], this._context));
            }

            return [
                new DependencyGroupTreeItem('Dependencies', dependencies),
                new DependencyGroupTreeItem('Development dependencies', devDependencies),
                new DependencyGroupTreeItem('Optional dependencies', optionalDependencies)
            ]
        } else {
            return (<DependencyGroupTreeItem>element).children;
        }
    }

    dispose() {
        this._packageJsonSubscription.unsubscribe();
    }
}