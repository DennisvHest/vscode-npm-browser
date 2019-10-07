import * as vscode from 'vscode';
import { TerminalCommand, CommandTypes } from '../../../../libs/shared/src/index'

const AnsiParser = require("ansi-parser");

export class NPMTerminal {

    private _terminal: vscode.Terminal | undefined;
    private _currentCommand: TerminalCommand | undefined | null;

    onCommandComplete: ((command: TerminalCommand) => void) | undefined;

    constructor() { }
    
    private getTerminal = (): vscode.Terminal => {
        if (!this._terminal) {
            this._terminal = vscode.window.createTerminal('Install package');

            vscode.window.onDidWriteTerminalData(this.onTerminalData);
        }

        return this._terminal;
    }

    private onTerminalData = (event: vscode.TerminalDataWriteEvent) => {
        if (/\nadded \d* packages/.test(event.data) && this._currentCommand && this._currentCommand.type === CommandTypes.npmInstall) {
            if (this.onCommandComplete)
                this.onCommandComplete(this._currentCommand);
            
            this._currentCommand = null;
        }
    }

    runCommand = (command: TerminalCommand) => {
        const terminal = this.getTerminal();
        
        terminal.show();
        terminal.sendText(command.command, true);
        this._currentCommand = command;
    }
    
}