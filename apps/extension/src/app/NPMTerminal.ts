import * as vscode from 'vscode';
import { TerminalCommand, CommandTypes, PackageJson, NpmInstallCommand } from '../../../../libs/shared/src/index'

import * as fs from "fs";
const readPackageJson = require('read-package-json');

export class NPMTerminal {

    private _terminal: vscode.Terminal | undefined | null;
    private _currentCommand: TerminalCommand | undefined | null;
    private _packageJson: PackageJson | undefined;

    private _packageJsonFileWatcher: vscode.FileSystemWatcher | undefined;

    /**
     * Function to run after a command completed execution. The completed
     * command is passed into the given function.
     */
    onCommandComplete: ((command?: TerminalCommand) => void) | undefined;

    onPackageJsonChange: ((packageJson: PackageJson) => void) | undefined;

    private readonly postCommandListeners: { [key: string]: () => () => void} = {
        'npm-install': () => this.afterNPMInstall
    };

    constructor() { }

    get packageJson() {
        return this._packageJson;
    }

    set packageJson(packageJson) {
        this._packageJson = packageJson;

        if (this._packageJsonFileWatcher)
            this._packageJsonFileWatcher.dispose();

        this._packageJsonFileWatcher = vscode.workspace.createFileSystemWatcher(this._packageJson!.filePath, true, false, true);

        this._packageJsonFileWatcher.onDidChange(async (packageJsonUri) => {
            const changedPackageJson = await this.loadPackageJson(packageJsonUri.fsPath);

            if (this.onPackageJsonChange)
                this.onPackageJsonChange(changedPackageJson);
        });
    }

    async findPackageJsons(): Promise<PackageJson[]> {
        let packageJsonFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**');

        if (!packageJsonFiles.length)
            return [];

        let readPackageJsonFiles = packageJsonFiles.map(packageJsonUri => this.loadPackageJson(packageJsonUri.fsPath));

        return Promise.all(readPackageJsonFiles);
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
                cwd: this.packageJson!.filePath.replace(/package\.json$/, '')
            });

            vscode.window.onDidWriteTerminalData(this.onTerminalData);
        }

        return this._terminal;
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

    private onTerminalData = (event: vscode.TerminalDataWriteEvent) => {
        if (/\nadded \d* package/.test(event.data) && this._currentCommand && this._currentCommand.type === CommandTypes.npmInstall) {
            this.completeCommand();
            return;
        }

        if (/\nremoved \d* package/.test(event.data) && this._currentCommand && this._currentCommand.type === CommandTypes.npmUninstall) {
            this.completeCommand();
            return;
        }
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

        const packageJson: PackageJson = JSON.parse(fs.readFileSync(this.packageJson!.filePath, 'utf8'));

        packageJson.dependencies[installCommand.packageName] = installCommand.versionRange;

        fs.writeFileSync(this.packageJson!.filePath, JSON.stringify(packageJson, null, 2))
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