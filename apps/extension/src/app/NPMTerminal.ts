import * as vscode from 'vscode';
import { TerminalCommand, CommandTypes, PackageJson, NpmInstallCommand, PackageType } from '../../../../libs/shared/src/index';
import { BehaviorSubject, Observable } from 'rxjs';

import * as fs from "fs";
import * as readPackageJson from 'read-package-json';

export class NPMTerminal {

    private _currentCommand: TerminalCommand | undefined | null;

    private _packageJson$: BehaviorSubject<PackageJson | undefined> = new BehaviorSubject<PackageJson | undefined>(undefined);
    private _packageJsons$: BehaviorSubject<PackageJson[]> = new BehaviorSubject<PackageJson[]>([]);

    private _packageJsonFileWatcher: vscode.FileSystemWatcher | undefined;

    /**
     * Function to run after a command completed execution. The completed
     * command is passed into the given function.
     */
    onCommandComplete: ((command?: TerminalCommand, success?: boolean) => void) | undefined;

    private readonly postCommandListeners: { [key: string]: () => () => void } = {
        'npm-install': () => this.afterNPMInstall
    };

    constructor() {
        const packageJsonsFileWatcher = vscode.workspace.createFileSystemWatcher('**/package.json');

        packageJsonsFileWatcher.onDidChange(this.onPackageJsonsChanged);
        packageJsonsFileWatcher.onDidCreate(this.onPackageJsonsChanged);
        packageJsonsFileWatcher.onDidDelete(this.onPackageJsonsChanged);
    }

    get packageJson(): Observable<PackageJson | undefined> {
        return this._packageJson$;
    }

    private get _packageJson(): PackageJson | undefined {
        return this._packageJson$.value;
    }

    get packageJsons(): Observable<PackageJson[]> {
        return this._packageJsons$;
    }

    setPackageJson = (packageJson: PackageJson) => {
        this._packageJson$.next(packageJson);

        if (this._packageJsonFileWatcher)
            this._packageJsonFileWatcher.dispose();

        if (!this._packageJson)
            return;

        this._packageJsonFileWatcher = vscode.workspace.createFileSystemWatcher(this._packageJson!.filePath, true, false, false);

        this._packageJsonFileWatcher.onDidChange(this.onPackageJsonFileChanged);
        this._packageJsonFileWatcher.onDidDelete(this.onPackageJsonFileDeleted);
    }

    private onPackageJsonsChanged = (uri: vscode.Uri) => {
        if (!uri.path.includes('**/node_modules/**'))
            this.findPackageJsons();
    }

    findPackageJsons = async () => {
        const packageJsonFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**');

        if (!packageJsonFiles.length)
            this._packageJsons$.next([]);

        const readPackageJsonFiles = packageJsonFiles
            .map(packageJsonUri => this.loadPackageJson(packageJsonUri.fsPath))
            .map(p => p.catch(e => null)); // Ignore failed reads

        const packageJsons = (await Promise.all(readPackageJsonFiles)).filter(f => f !== null);

        this._packageJsons$.next(packageJsons);
    }

    private onPackageJsonFileChanged = async (packageJsonUri) => {
        let changedPackageJson;

        try {
            changedPackageJson = await this.loadPackageJson(packageJsonUri.fsPath);
        } catch (error) {
            changedPackageJson = null;
        }

        if (changedPackageJson) {
            changedPackageJson = { ...changedPackageJson, filePath: changedPackageJson.filePath };
        } else {
            await this.findPackageJsons();
        }

        this._packageJson$.next(changedPackageJson);
    }

    private onPackageJsonFileDeleted = async () => {
        await this.findPackageJsons();

        this._packageJson$.next(null)
    }

    private getPackageJsonDependencyField(packageType: PackageType) {
        switch (packageType) {
            case PackageType.Dependency: return "dependencies";
            case PackageType.DevDependency: return "devDependencies";
            case PackageType.OptionalDependency: return "optionalDependencies";
            default: throw "Unknown package type!"
        }
    }

    private loadPackageJson(filePath: string) {
        return new Promise<PackageJson>((resolve, reject) => {
            let _readPackageJson;

            // Fix for difference in commonjs module (production) and es6 module (debug)
            if (readPackageJson.default) {
                _readPackageJson = readPackageJson.default;
            } else {
                _readPackageJson = readPackageJson;
            }

            _readPackageJson(filePath, false, (error, data: PackageJson) => {
                // TODO: Test error handling
                if (error)
                    reject(error);

                data.filePath = filePath;

                resolve(data);
            });
        });
    }

    async reloadPackageJson() {
        if (this._packageJson) {
            try {
                const currentPackageJson = await this.loadPackageJson(this._packageJson!.filePath);
                this.setPackageJson(currentPackageJson);
            } catch (error) {
                this.setPackageJson(null);
            }
        }
    }

    private completeCommand = async (success: boolean) => {
        if (this.postCommandListeners[this._currentCommand!.type])
            this.postCommandListeners[this._currentCommand!.type]()();

        if (this.onCommandComplete)
            this.onCommandComplete(this._currentCommand, success);

        this._currentCommand = null;
    }

    private afterNPMInstall = () => {
        const installCommand = this._currentCommand as NpmInstallCommand;

        const packageJson: PackageJson = JSON.parse(fs.readFileSync(this._packageJson!.filePath, 'utf8'));

        const dependencyType = this.getPackageJsonDependencyField(installCommand.packageType);

        if (packageJson.dependencies && packageJson.dependencies[installCommand.packageName])
            packageJson.dependencies[installCommand.packageName] = installCommand.versionRange;

        if (packageJson[dependencyType] && packageJson[dependencyType][installCommand.packageName])
            packageJson[dependencyType][installCommand.packageName] = installCommand.versionRange;

        fs.writeFileSync(this._packageJson!.filePath, JSON.stringify(packageJson, null, 2))
    }

    /**
     * Runs the given TerminalCommand in the NPM terminal.
     * @param command TerminalCommand to run.
     */
    runCommand = (command: TerminalCommand) => {
        const task = new vscode.Task(
            { type: 'npm', task: command.type },
            vscode.TaskScope.Workspace,
            command.type,
            'npm',
            new vscode.ShellExecution(command.command, { cwd: this._packageJson!.filePath.replace(/package\.json$/, '') })
        );

        vscode.tasks.onDidEndTaskProcess((event) => {
            if (event.execution.task === task && event.exitCode !== 0) {
                this.completeCommand(false);
            } else {
                this.completeCommand(true);
            }
        });

        vscode.tasks.executeTask(task);

        this._currentCommand = command;
    }

}