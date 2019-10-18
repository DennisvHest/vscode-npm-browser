export interface Command {
    readonly type: string;
}

export class CommandTypes {
    static readonly npmInstall = 'npm-install';
    static readonly npmInstallComplete = 'npm-install-complete';

    static readonly packageJsonSelected = 'package-json-selected';

    static readonly vsCodeToastCommand = 'vscode-toast-command';
}