import { ApplicationState } from '.';
import { InstalledPackage, PackageType } from 'libs/shared/src';

export const getPackageSearchQuery = (state: ApplicationState) => state.packageSearchQuery;

export const getPackageSearchResult = (state: ApplicationState) => state.packageSearchResult;

export const getSelectedPackageName = (state: ApplicationState) => state.selectedPackageName;

export const getSelectedPackageResult = (state: ApplicationState) => {
    if (!state.packageSearchResult || !state.selectedPackageName)
        return null;

    return state.packageSearchResult.objects.find(result => result.package.name === state.selectedPackageName);
};

export const getFetchedPackage = (state: ApplicationState) => state.fetchedPackage;

export const getCurrentPackage = (state: ApplicationState) => state.loadedPackage;

export const getInstallingPackage = (state: ApplicationState) => state.installingPackage;

export const getUninstallingPackage = (state: ApplicationState) => state.uninstallingPackage;

export const getInstalledPackages = (state: ApplicationState): InstalledPackage[] => {
    if (!state.vscodeWorkspace.selectedPackageJson)
        return [];

    const dependencies = state.vscodeWorkspace.selectedPackageJson.dependencies;
    const devDependencies = state.vscodeWorkspace.selectedPackageJson.devDependencies;
    const optionalDependencies = state.vscodeWorkspace.selectedPackageJson.optionalDependencies;

    let installedDependencies: InstalledPackage[] = [];

    if (dependencies) {
        installedDependencies = Object.keys(dependencies).map(npmPackage => {
            return new InstalledPackage(npmPackage, dependencies[npmPackage], PackageType.Dependency)
        });
    }

    let installedDevDependencies: InstalledPackage[] = [];

    if (devDependencies) {
        installedDevDependencies = Object.keys(devDependencies).map(npmPackage => {
            return new InstalledPackage(npmPackage, devDependencies[npmPackage], PackageType.DevDependency)
        });
    }

    let installedOptionalDependencies: InstalledPackage[] = [];

    if (optionalDependencies) {
        installedOptionalDependencies = Object.keys(optionalDependencies).map(npmPackage => {
            return new InstalledPackage(npmPackage, optionalDependencies[npmPackage], PackageType.OptionalDependency)
        });
    }

    // Order is importent here because of removing duplicates below.
    let allInstalledDependencies = [...installedOptionalDependencies, ...installedDevDependencies, ...installedDependencies];

    // Remove duplicate installed packages (selectedPackageJson.dependencies contains ALL dependencies including dev, optional, etc.).
    allInstalledDependencies = allInstalledDependencies.filter((dependency, index, self) => {
        return index === self.findIndex(d => d.name === dependency.name);
    });

    return allInstalledDependencies;
};

export const getSelectedPackageJson = (state: ApplicationState) => state.vscodeWorkspace.selectedPackageJson;

export const getPackageJsons = (state: ApplicationState) => state.vscodeWorkspace.packageJsons;
