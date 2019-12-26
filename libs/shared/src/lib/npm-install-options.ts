import { PackageType } from './package-type';

export interface NpmInstallOptions {
    packageName: string,
    packageVersion: string,
    updateLevel: number,
    packageType: PackageType
}