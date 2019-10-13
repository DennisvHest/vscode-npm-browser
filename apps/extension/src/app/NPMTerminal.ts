import * as vscode from 'vscode';
import { TerminalCommand, CommandTypes, PackageJson } from '../../../../libs/shared/src/index'

const readPackageJson = require('read-package-json');

export class NPMTerminal {

    private _terminal: vscode.Terminal | undefined | null;
    private _currentCommand: TerminalCommand | undefined | null;

    private _packageJsonUri: vscode.Uri | undefined;
    
    packageJson: PackageJson;

    /**
     * Function to run after a command completed execution. The completed
     * command is passed into the given function.
     */
    onCommandComplete: ((command: TerminalCommand) => void) | undefined;

    constructor() { }

    async findPackageJson() {
        let packageJsonFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**');

        if (packageJsonFiles.length) {
            this._packageJsonUri = packageJsonFiles[0];

            return new Promise<void>((resolve, reject) => {
                readPackageJson(this._packageJsonUri!.fsPath, null, false, (error, data: PackageJson) => {
                    if (error)
                        reject(error);

                    this.packageJson = data;
                    resolve();
                });
            });
        }
    }

    /**
     * Gets the singleton instance of the NPM terminal.
     */
    private getTerminal = (): vscode.Terminal => {
        if (!this._terminal) {
            this._terminal = vscode.window.createTerminal({
                name: 'Install package',
                // TODO: Handle case where there is no package.json file in the workspace
                cwd: this._packageJsonUri!.fsPath.replace(/package\.json$/, '')
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
            if (this.onCommandComplete)
                this.onCommandComplete(this._currentCommand);

            this._currentCommand = null;
        }
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