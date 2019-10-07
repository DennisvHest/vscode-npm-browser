export interface Command {
    readonly type: string;
}

export class CommandTypes {
    static readonly npmInstall = 'npm-install';
    static readonly npmInstallComplete = 'npm-install-complete';
}