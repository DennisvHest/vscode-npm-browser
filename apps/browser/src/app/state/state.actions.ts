import { createAction, props } from '@ngrx/store';
import { PackageSearchResult } from '../model/package-search-result.model';
import { Package } from '../model/package.model';
import { Command, ValueCommand, PackageJson } from 'libs/shared/src';

// Search actions
export const packageSearchQueryChanged = createAction(
    '[Search] Package search query changed.',
    props<{ value: PackageSearchQuery }>()
);

export const packageSearchResultChanged = createAction(
    '[Search] Package search results changed.',
    props<{ value: PackageSearchResult }>()
);

export const selectedPackageChanged = createAction(
    '[Search] Package selected.',
    props<{ value: string }>()
);

export const currentPackageLoaded = createAction(
    '[Search] Package loaded.',
    props<{ value: Package }>()
);

// Package installation actions
export const installPackage = createAction(
    '[Install] Install package triggered.',
    props<{ value: Command }>()
);

export const installPackageComplete = createAction(
    '[Install] Install package completed.'
);

export const uninstallPackage = createAction(
    '[Install] Uninstall package triggered.',
    props<{ value: Command }>()
);

export const uninstallPackageComplete = createAction(
    '[Install] Uninstall package completed.'
);

export const packageJsonUpdated = createAction(
    '[Install] Package.json updated.',
    props<{ value: PackageJson }>()
);

export const packageJsonsUpdated = createAction(
    '[Install] Package.jsons updated.',
    props<{ value: PackageJson[] }>()
);

// Settings actions
export const packageJsonSelected = createAction(
    "[Settings] Package.json selected.",
    props<{ value: ValueCommand }>()
);