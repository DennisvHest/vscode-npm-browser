import { Command } from './command';

export class ToastLevels {
    static readonly info = 'info';
    static readonly error = 'error';
}

export class VSCodeToastCommand implements Command {
    readonly type = 'vscode-toast-command';

    constructor(
        public message, 
        public level = ToastLevels.info
    ) { }
}