import * as vscode from 'vscode';
import { TerminalCommand, CommandTypes } from '../../../../libs/shared/src/index'

export class NPMTerminal {

    private _terminal: vscode.Terminal | undefined | null;
    private _currentCommand: TerminalCommand | undefined | null;

    /**
     * Function to run after a command completed execution. The completed
     * command is passed into the given function.
     */
    onCommandComplete: ((command: TerminalCommand) => void) | undefined;

    constructor() { }

    /**
     * Gets the singleton instance of the NPM terminal.
     */
    private getTerminal = (): vscode.Terminal => {
        if (!this._terminal) {
            this._terminal = vscode.window.createTerminal('Install package');

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