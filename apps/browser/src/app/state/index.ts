import { ActionReducerMap, createReducer, on } from '@ngrx/store';
import { packageSearchResultChanged, selectedPackageChanged, currentPackageLoaded, installPackage } from './state.actions';
import { PackageSearchResult } from '../model/package-search-result.model';
import { Package } from '../model/package.model';

export interface ApplicationState {
    packageSearchResult: PackageSearchResult;
    selectedPackageName: string | null;
    loadedPackage: Package;
    installingPackage: boolean;
}

const packageSearchResultInitialState = { objects: [], total: 0 };

export function initialState() {
    const initialStateFromVSCode: ApplicationState = vscode.getState();

    return initialStateFromVSCode
        ? { ...initialStateFromVSCode, installingPackage: null }
        : {
            packageSearchResult: packageSearchResultInitialState,
            selectedPackageId: null,
            loadedPackage: null
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
    return createReducer(null, on(installPackage, () => true))(state, action);
}

export const reducers: ActionReducerMap<ApplicationState> = {
    packageSearchResult: packageSearchResultsReducer,
    selectedPackageName: selectedPackageIdReducer,
    loadedPackage: currentPackageReducer,
    installingPackage: installingPackageReducer
};

