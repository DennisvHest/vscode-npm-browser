import { ApplicationState } from '.';

export const getPackageSearchResult = (state: ApplicationState) => state.packageSearchResult;

export const getSelectedPackageName = (state: ApplicationState) => state.selectedPackageName;

export const getSelectedPackageResult = (state: ApplicationState) => {
    if (!state.packageSearchResult || !state.selectedPackageName)
        return null;

    return state.packageSearchResult.objects.find(result => result.package.name === state.selectedPackageName);
};

export const getCurrentPackage = (state: ApplicationState) => state.loadedPackage;

export const getInstallingPackage = (state: ApplicationState) => state.installingPackage;

export const getInstalledPackages = (state: ApplicationState) => state.vscodeWorkspace.selectedPackageJson ? state.vscodeWorkspace.selectedPackageJson.dependencies : [];

export const getSelectedPackageJson = (state: ApplicationState) => state.vscodeWorkspace.selectedPackageJson;

export const getPackageJsons = (state: ApplicationState) => state.vscodeWorkspace.packageJsons;
