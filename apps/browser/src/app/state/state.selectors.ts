import { ApplicationState } from '.';
import { InstalledPackage, PackageType } from 'libs/shared/src';

export const getPackageSearchResult = (state: ApplicationState) => state.packageSearchResult;

export const getSelectedPackageName = (state: ApplicationState) => state.selectedPackageName;

export const getSelectedPackageResult = (state: ApplicationState) => {
    if (!state.packageSearchResult || !state.selectedPackageName)
        return null;

    return state.packageSearchResult.objects.find(result => result.package.name === state.selectedPackageName);
};

export const getCurrentPackage = (state: ApplicationState) => state.loadedPackage;

export const getInstallingPackage = (state: ApplicationState) => state.installingPackage;

export const getUninstallingPackage = (state: ApplicationState) => state.uninstallingPackage;

export const getInstalledPackages = (state: ApplicationState): InstalledPackage[] => {
    if (!state.vscodeWorkspace.selectedPackageJson)
        return [];

    const dependencies = state.vscodeWorkspace.selectedPackageJson.dependencies;
    const devDependencies = state.vscodeWorkspace.selectedPackageJson.devDependencies;
    const optionalDependencies = state.vscodeWorkspace.selectedPackageJson.optionalDependencies;

    let installedDependencies = [];
    
    if (dependencies) {
        installedDependencies = Object.keys(dependencies).map(npmPackage => {
            return new InstalledPackage(npmPackage, dependencies[npmPackage], PackageType.Dependency)
        });
    }

    let installedDevDependencies = [];
    
    if (devDependencies) {
        installedDevDependencies = Object.keys(devDependencies).map(npmPackage => {
            return new InstalledPackage(npmPackage, devDependencies[npmPackage], PackageType.DevDependency)
        });
    }

    let installedOptionalDependencies = [];

    if (optionalDependencies) {
        installedOptionalDependencies = Object.keys(optionalDependencies).map(npmPackage => {
            return new InstalledPackage(npmPackage, optionalDependencies[npmPackage], PackageType.OptionalDependency)
        });
    }

    return [...installedDependencies, ...installedDevDependencies, ...installedOptionalDependencies];
};

export const getSelectedPackageJson = (state: ApplicationState) => state.vscodeWorkspace.selectedPackageJson;

export const getPackageJsons = (state: ApplicationState) => state.vscodeWorkspace.packageJsons;
