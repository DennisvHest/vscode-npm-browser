import { ActionReducerMap, createReducer, on } from '@ngrx/store';
import { packageSearchResultChanged, selectedPackageChanged, currentPackageLoaded, installPackage, installPackageComplete, packageJsonSelected, packageJsonUpdated } from './state.actions';
import { PackageSearchResult } from '../model/package-search-result.model';
import { Package } from '../model/package.model';

export interface ApplicationState {
    packageSearchResult: PackageSearchResult;
    selectedPackageName: string | null;
    loadedPackage: Package;
    installingPackage: boolean;
    vscodeWorkspace: VSCodeWorkspace;
}

const packageSearchResultInitialState = { objects: [], total: 0 };

export function initialState() {
    const initialStateFromVSCode: ApplicationState = vscode.getState();

    return initialStateFromVSCode
        ? { ...initialStateFromVSCode, vscodeWorkspace: workspaceState, installingPackage: null }
        : {
            packageSearchResult: packageSearchResultInitialState,
            selectedPackageId: null,
            loadedPackage: null,
            installingPackage: null,
            vscodeWorkspace: workspaceState
        };
}

export function packageSearchResultsReducer(state, action) {
    return createReducer(packageSearchResultInitialState,
        on(packageSearchResultChanged, (currentState, { value }) => {
            return { ...currentState, ...value };
        })
    )(state, action);
}

export function selectedPackageIdReducer(state, action) {
    return createReducer(null,
        on(selectedPackageChanged, (currentState, { value }) => {
            return value;
        })
    )(state, action);
}

export function currentPackageReducer(state, action) {
    return createReducer(null,
        on(currentPackageLoaded, (currentState, { value }) => {
            if (!currentState)
                return value;

            return { ...currentState, ...value };
        })
    )(state, action);
}

export function installingPackageReducer(state, action) {
    return createReducer(null,
        on(installPackage, () => true),
        on(installPackageComplete, () => false)
    )(state, action);
}

export function vscodeWorkspaceReducer(state, action) {
    const updatePackageJson = (currentState, { value }) => {
        return { ...currentState, selectedPackageJson: value }
    }

    return createReducer(null,
        on(packageJsonSelected, (currentState, { value }) => updatePackageJson(currentState, value)),
        on(packageJsonUpdated, (currentState, { value }) => updatePackageJson(currentState, { value: value }))
    )(state, action);
}

export const reducers: ActionReducerMap<ApplicationState> = {
    packageSearchResult: packageSearchResultsReducer,
    selectedPackageName: selectedPackageIdReducer,
    loadedPackage: currentPackageReducer,
    installingPackage: installingPackageReducer,
    vscodeWorkspace: vscodeWorkspaceReducer
};

