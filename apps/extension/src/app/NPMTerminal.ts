import * as vscode from 'vscode';
import { TerminalCommand } from '@npm-browser/shared';

export class NPMTerminal {

    private _terminal: vscode.Terminal | undefined;

    constructor() { }
    
    private getTerminal(): vscode.Terminal {
        if (!this._terminal) {
            this._terminal = vscode.window.createTerminal('Install package');

            (<any>vscode.window).onDidWriteTerminalData((e) => {
                console.log('hoi');
            });
        }

        return this._terminal;
    }

    runCommand = (command: TerminalCommand) => {
        const terminal = this.getTerminal();
        
        terminal.show();
		terminal.sendText(command.command, true);
    }
    
}