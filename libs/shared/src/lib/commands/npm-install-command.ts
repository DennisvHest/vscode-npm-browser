import { TerminalCommand } from "./terminal-command";
import { NpmInstallOptions } from '../npm-install-options';
import { applyRangeOptions } from '../semver/semver-extensions';

export class NpmInstallCommand implements TerminalCommand {
    type = 'npm-install';

    command: string;
    packageName: string;
    versionRange: string;

    constructor(options: NpmInstallOptions) {
        this.packageName = options.packageName;
        this.versionRange = applyRangeOptions(options.packageVersion, options.updateLevel).raw;

        const optionFlags: string[] = [];

        if (options.updateLevel === 0)
            optionFlags.push('--save-exact');
        
        this.command = `npm install ${this.packageName}@"${options.packageVersion}"${optionFlags.map(o => ' ' + o).join()}`;
    }
}