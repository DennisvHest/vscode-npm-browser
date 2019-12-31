import { NpmInstallOptions } from '../npm-install-options';
import { applyRangeOptions } from '../semver/semver-extensions';
import { PackageType } from '../package-type';
import { PackageInstallationCommand } from './package-installation-command';

export class NpmInstallCommand implements PackageInstallationCommand {
    type = 'npm-install';

    command: string;
    packageName: string;
    versionRange: string;
    packageType: PackageType;

    constructor(options: NpmInstallOptions) {
        this.packageName = options.packageName;
        this.packageType = options.packageType;
        this.versionRange = applyRangeOptions(options.packageVersion, options.updateLevel).raw;

        const optionFlags: string[] = [];
        
        let dependencyTypeFlag: string;
        
        switch (options.packageType) {
            case PackageType.Dependency: dependencyTypeFlag = '--save-prod'; break;
            case PackageType.DevDependency: dependencyTypeFlag = '--save-dev'; break;
            case PackageType.OptionalDependency: dependencyTypeFlag = '--save-optional'; break;
        }
        
        if (dependencyTypeFlag)
            optionFlags.push(dependencyTypeFlag);
        
        if (options.updateLevel === 0)
            optionFlags.push('--save-exact');

        this.command = `npm install ${this.packageName}@"${options.packageVersion}"${optionFlags.map(o => ' ' + o).join('')}`;
    }
}