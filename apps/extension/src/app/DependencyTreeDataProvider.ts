import * as vscode from 'vscode';
import { DependencyTreeItem } from './DependencyTreeItem';
import { DependencyGroupTreeItem } from './DependencyGroupTreeItem';
import { PackageJson, PackageUpdatesItem } from 'libs/shared/src';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { UpdateAllPackagesTreeItem } from './UpdateAllPackagesTreeItem';

type Dependency = {
    packageItem: PackageItem;
    updates: PackageUpdatesItem;
}

type PackageItem  = {
    name: string;
    version: string;
};

type DependencyCollection = {
    dependencies: Dependency[];
    devDependencies: Dependency[];
    optionalDependencies: Dependency[];
}

export class DependencyTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
    
    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

    private _packageJsonSubscription: Subscription;
    
    private _dependencyCollection: DependencyCollection;

    constructor(private _packageJson$: Observable<PackageJson | undefined>, private _packageUpdates$: Observable<{ [name: string]: PackageUpdatesItem; }>, private _context: vscode.ExtensionContext) {
        this._packageJsonSubscription = combineLatest([this._packageJson$, this._packageUpdates$]).pipe(
            map(([packageJson, packageUpdates]): DependencyCollection => {
                return {
                    dependencies: Object.keys(packageJson ? (packageJson.dependencies || {}) : {})
                        .map(dependency => ({ packageItem: { name: dependency, version: packageJson.dependencies[dependency] }, updates: packageUpdates[dependency] })),
                    devDependencies: Object.keys(packageJson ? (packageJson.devDependencies || {}) : {})
                        .map(dependency => ({ packageItem: { name: dependency, version: packageJson.devDependencies[dependency] }, updates: packageUpdates[dependency] })),
                    optionalDependencies: Object.keys(packageJson ? (packageJson.optionalDependencies || {}) : {})
                        .map(dependency => ({ packageItem: { name: dependency, version: packageJson.optionalDependencies[dependency] }, updates: packageUpdates[dependency] }))
                }
            })
        ).subscribe(dependencyCollection => {
            this._dependencyCollection = dependencyCollection;

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

            if (this._dependencyCollection) {
                dependencies = this._dependencyCollection.dependencies
                    .map(dependency => new DependencyTreeItem(dependency.packageItem.name, dependency.packageItem.version, dependency.updates, this._context));

                devDependencies = this._dependencyCollection.devDependencies
                    .map(dependency => new DependencyTreeItem(dependency.packageItem.name, dependency.packageItem.version, dependency.updates, this._context));

                optionalDependencies = this._dependencyCollection.optionalDependencies
                    .map(dependency => new DependencyTreeItem(dependency.packageItem.name, dependency.packageItem.version, dependency.updates, this._context));
            }

            return [
                new UpdateAllPackagesTreeItem(this._context),
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