import { TerminalCommand } from "./terminal-command";
import { PackageType } from '../package-type';

export class NpmUninstallCommand implements TerminalCommand {
    type = 'npm-uninstall';

    command: string;

    constructor(
        public packageName: string,
        public packageType: PackageType
    ) {
        let dependencyTypeFlag: string;

        const optionFlags: string[] = [];

        switch (packageType) {
            case PackageType.Dependency: dependencyTypeFlag = '--save'; break;
            case PackageType.DevDependency: dependencyTypeFlag = '--save-dev'; break;
            case PackageType.OptionalDependency: dependencyTypeFlag = '--save-optional'; break;
        }

        if (dependencyTypeFlag)
            optionFlags.push(dependencyTypeFlag);

        this.command = `npm uninstall ${this.packageName}${optionFlags.map(o => ' ' + o).join()}`;
    }
}