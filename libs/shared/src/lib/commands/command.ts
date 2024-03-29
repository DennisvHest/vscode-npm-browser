export interface Command {
    readonly type: string;
}

export class CommandTypes {
    static readonly npmInstall = 'npm-install';
    static readonly npmInstallComplete = 'npm-install-complete';
    static readonly npmUninstallComplete = 'npm-uninstall-complete';
    static readonly npmUninstall = 'npm-uninstall';
    static readonly fetchPackage = 'fetch-package';
    static readonly fetchPackageComplete = 'fetch-package-complete';
    static readonly npmOutdated = 'npm-outdated';
    static readonly npmUpdate = 'npm-update';
    
    static readonly packageJsonSelected = 'package-json-selected';
    static readonly packageJsonUpdated = 'package-json-updated';

    static readonly packageJsonsUpdated = 'package-jsons-updated';

    static readonly vsCodeToastCommand = 'vscode-toast-command';

    static readonly installedPackageSelected = 'installed-package-selected';

    static readonly webRequestCommand = 'web-request-command';
    static readonly webResponseCommand = 'web-response-command';
}