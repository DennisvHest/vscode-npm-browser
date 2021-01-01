import * as vscode from 'vscode';
import { TerminalCommand, PackageJson, NpmInstallCommand, PackageType, PackageUpdatesItem, NpmOutdatedCommand, CommandTypes } from '../../../../libs/shared/src/index';
import { BehaviorSubject, Observable } from 'rxjs';

import * as fs from "fs";
import * as readPackageJson from 'read-package-json';
import * as util from 'util'
import * as cp from 'child_process'
import { ENGINE_METHOD_DIGESTS } from 'constants';

export class NPMTerminal {

    private _currentCommands: TerminalCommand[] = [];

    private get _currentCommand() {
        return this._currentCommands[0];
    };

    private _packageJson$: BehaviorSubject<PackageJson | undefined> = new BehaviorSubject<PackageJson | undefined>(undefined);
    private _packageJsons$: BehaviorSubject<PackageJson[]> = new BehaviorSubject<PackageJson[]>([]);

    private _packageUpdates$ = new BehaviorSubject<{ [name: string]: PackageUpdatesItem; }>({});

    private _packageJsonFileWatcher: vscode.FileSystemWatcher | undefined;

    /**
     * Function to run after a command completed execution. The completed
     * command is passed into the given function.
     */
    onCommandComplete: ((command?: TerminalCommand, success?: boolean, result?: any) => void) | undefined;

    private readonly postCommandListeners: { [key: string]: () => (success: boolean, result?: any) => void } = {
        'npm-install': () => this.afterNPMInstall,
        'npm-outdated': () => this.afterNpmOutdatedCommand
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

    get packageUpdates(): Observable<{ [name: string]: PackageUpdatesItem; }> {
        return this._packageUpdates$;
    }

    private get packageJsonPath(): string {
        return this._packageJson!.filePath.replace(/package\.json$/, '');
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

    checkPackageUpdates() {
        this.queueCommand(new NpmOutdatedCommand());
    }

    private completeCommand = async (success: boolean, result?: any) => {
        if (this.postCommandListeners[this._currentCommand!.type])
            this.postCommandListeners[this._currentCommand!.type]()(success, result);

        if (this.onCommandComplete)
            this.onCommandComplete(this._currentCommand, success, result);

        this._currentCommands.shift();
        this.runNextCommand();
    }

    private afterNPMInstall = () => {
        const installCommand = this._currentCommand as NpmInstallCommand;

        const packageJson: PackageJson = JSON.parse(fs.readFileSync(this._packageJson!.filePath, 'utf8'));

        const dependencyType = this.getPackageJsonDependencyField(installCommand.packageType);

        if (packageJson.dependencies && packageJson.dependencies[installCommand.packageName])
            packageJson.dependencies[installCommand.packageName] = installCommand.versionRange;

        if (packageJson[dependencyType] && packageJson[dependencyType][installCommand.packageName])
            packageJson[dependencyType][installCommand.packageName] = installCommand.versionRange;

        fs.writeFileSync(this._packageJson!.filePath, JSON.stringify(packageJson, null, 2));

        this.checkPackageUpdates();
    }

    private afterNpmOutdatedCommand = (success: boolean, result?: any) => {
        if (!success)
            this._packageUpdates$.next({});

        for (let packageName of Object.keys(result)) {
            result[packageName] = new PackageUpdatesItem(result[packageName]);
        }

        this._packageUpdates$.next(result);
    }

    /**
     * Adds the given command to the queue to be processed. If the given command is the only one in the queue, it is immediately run.
     * @param command TerminalCommand to enqueue.
     */
    queueCommand = (command: TerminalCommand) => {
        this._currentCommands.push(command);

        if (this._currentCommands.length === 1)
            this.runNextCommand();
    }

    /**
     * Runs the next TerminalCommand in the NPM terminal.
     */
    runNextCommand = () => {
        const nextCommand = this._currentCommands[0];

        if (nextCommand) {
            if (nextCommand.runAsVSCodeTask) {
                this.runCommandAsVSCodeTask(nextCommand);
            } else {
                this.runCommandAsChildProcess(nextCommand);
            }
        }
    }

    runCommandAsVSCodeTask = (command: TerminalCommand) => {
        const task = new vscode.Task(
            { type: 'npm', task: command.type },
            vscode.TaskScope.Workspace,
            command.type,
            'npm',
            new vscode.ShellExecution(command.command, { cwd: this.packageJsonPath })
        );

        vscode.tasks.onDidEndTaskProcess((event) => {
            if (event.execution.task.name === task.name && event.exitCode !== 0) {
                this.completeCommand(false);
            } else if (this._currentCommand) {
                this.completeCommand(true);
            }
        });

        vscode.tasks.executeTask(task);
    }

    runCommandAsChildProcess = async (command: TerminalCommand) => {
        let stdout;

        try {
            const result = await util.promisify(cp.exec)(command.command, { cwd: this.packageJsonPath });
            stdout = result.stdout;
        } catch (e) {
            // NPM outdated returns exit code 1 when outdated packages are found
            if (e.code === 1 && command.type === CommandTypes.npmOutdated) {
                stdout = e.stdout;
            } else {
                console.error(`failed to execute command ${command.command}`);
                this.completeCommand(false);
                return;
            }
        }

        const packageInfo = JSON.parse(stdout);
        this.completeCommand(true, packageInfo);
    }

}