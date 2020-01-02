import * as vscode from 'vscode';
import { TerminalCommand, CommandTypes, PackageJson, NpmInstallCommand, PackageType } from '../../../../libs/shared/src/index';
import { BehaviorSubject, Observable } from 'rxjs';

import * as fs from "fs";
import { diff } from 'json-diff';
import { PackageInstallationCommand } from 'libs/shared/src/lib/commands/package-installation-command';
const readPackageJson = require('read-package-json');

export class NPMTerminal {

    private _terminal: vscode.Terminal | undefined | null;
    private _currentCommand: TerminalCommand | undefined | null;

    private _packageJson$: BehaviorSubject<PackageJson | undefined> = new BehaviorSubject<PackageJson | undefined>(undefined);
    
    private _packageJsonFileWatcher: vscode.FileSystemWatcher | undefined;
    
    /**
     * Function to run after a command completed execution. The completed
     * command is passed into the given function.
     */
    onCommandComplete: ((command?: TerminalCommand) => void) | undefined;
    
    onPackageJsonChange: ((packageJson: PackageJson) => void) | undefined;
    
    private readonly postCommandListeners: { [key: string]: () => () => void } = {
        'npm-install': () => this.afterNPMInstall
    };
    
    constructor() { }
    
    get packageJson(): Observable<PackageJson | undefined> {
        return this._packageJson$;
    }

    private get _packageJson(): PackageJson | undefined {
        return this._packageJson$.value;
    }

    setPackageJson(packageJson: PackageJson) {
        this._packageJson$.next(packageJson);

        if (this._packageJsonFileWatcher)
            this._packageJsonFileWatcher.dispose();

        this._packageJsonFileWatcher = vscode.workspace.createFileSystemWatcher(this._packageJson!.filePath, true, false, true);

        this._packageJsonFileWatcher.onDidChange(this.onPackageJsonFileChanged);
    }

    async findPackageJsons(): Promise<PackageJson[]> {
        let packageJsonFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**');

        if (!packageJsonFiles.length)
            return [];

        let readPackageJsonFiles = packageJsonFiles.map(packageJsonUri => this.loadPackageJson(packageJsonUri.fsPath));

        return Promise.all(readPackageJsonFiles);
    }

    private onPackageJsonFileChanged = async (packageJsonUri) => {
        let changedPackageJson = await this.loadPackageJson(packageJsonUri.fsPath);

        changedPackageJson = { ...changedPackageJson, filePath: changedPackageJson.filePath };

        this.checkPackageJsonDifferences(changedPackageJson);

        this._packageJson$.next(changedPackageJson);

        if (this.onPackageJsonChange)
            this.onPackageJsonChange(changedPackageJson);
    }

    private checkPackageJsonDifferences = (changedPackageJson: Object) => {
        if (!this._currentCommand || this._currentCommand.type !== CommandTypes.npmInstall && this._currentCommand.type !== CommandTypes.npmUninstall)
            return;

        const packageJsonDiff = diff(this._packageJson, changedPackageJson);

        if (!packageJsonDiff)
            return; // No change

        const currentCommand = this._currentCommand as PackageInstallationCommand;

        let dependencyType;

        switch (currentCommand.packageType) {
            case PackageType.Dependency: dependencyType = "dependencies"; break;
            case PackageType.DevDependency: dependencyType = "devDependencies"; break;
            case PackageType.OptionalDependency: dependencyType = "optionalDependencies"; break;
        }

        const dependencies = packageJsonDiff[dependencyType];

        // No change in dependencies, so no package (un)installed
        if (!dependencies)
            return;

        if (this._currentCommand.type === CommandTypes.npmInstall && dependencies[`${currentCommand.packageName}__added`] || dependencies[currentCommand.packageName]) {
            // Package was installed (as new or updated/downgraded version)
            this.completeCommand();
        } else if (this._currentCommand.type === CommandTypes.npmUninstall && dependencies[`${currentCommand.packageName}__deleted`]) {
            // Package was uninstalled
            this.completeCommand();
        }
    }

    private loadPackageJson(filePath: string) {
        return new Promise<PackageJson>((resolve, reject) => {
            readPackageJson(filePath, false, (error, data: PackageJson) => {
                // TODO: Test error handling
                if (error)
                    reject(error);

                data.filePath = filePath;

                resolve(data);
            });
        });
    }

    /**
     * Gets the singleton instance of the NPM terminal.
     */
    private getTerminal = (): vscode.Terminal => {
        if (!this._terminal) {
            this._terminal = vscode.window.createTerminal({
                name: 'Install package',
                // TODO: Handle case where there is no package.json file in the workspace
                cwd: this._packageJson!.filePath.replace(/package\.json$/, '')
            });

            vscode.window.onDidWriteTerminalData(this.onTerminalData);
        }

        return this._terminal;
    }

    private onTerminalData = (event: vscode.TerminalDataWriteEvent) => {
        if (/\nupdated \d* package/.test(event.data) && this._currentCommand && this._currentCommand.type === CommandTypes.npmInstall) {
            this.completeCommand();
        }
    }

    /**
     * Disposes of the current NPM terminal (if it exists) and returns a new NPM terminal.
     */
    private refreshTerminal = (): vscode.Terminal => {
        if (this._terminal) {
            this._terminal.dispose();
            this._terminal = null;
        }

        return this.getTerminal();
    }
    

    private completeCommand = async () => {
        if (this.postCommandListeners[this._currentCommand!.type])
            this.postCommandListeners[this._currentCommand!.type]()();

        if (this.onCommandComplete)
            this.onCommandComplete(this._currentCommand);

        this._currentCommand = null;
    }

    private afterNPMInstall = () => {
        const installCommand = this._currentCommand as NpmInstallCommand;

        const packageJson: PackageJson = JSON.parse(fs.readFileSync(this._packageJson!.filePath, 'utf8'));

        packageJson.dependencies[installCommand.packageName] = installCommand.versionRange;

        fs.writeFileSync(this._packageJson!.filePath, JSON.stringify(packageJson, null, 2))
    }

    /**
     * Runs the given TerminalCommand in the NPM terminal.
     * @param command TerminalCommand to run.
     */
    runCommand = (command: TerminalCommand) => {
        const terminal = this.refreshTerminal();

        terminal.show();
        terminal.sendText(command.command, true);
        this._currentCommand = command;
    }

}