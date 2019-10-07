import { createAction, props } from '@ngrx/store';
import { PackageSearchResult } from '../model/package-search-result.model';
import { Package } from '../model/package.model';

// Search actions
export const packageSearchResultChanged = createAction(
    '[Search] Package search results changed.',
    props<{value: PackageSearchResult}>()
);

export const selectedPackageChanged = createAction(
    '[Search] Package selected.',
    props<{value: string}>()
);

export const currentPackageLoaded = createAction(
    '[Search] Package loaded.',
    props<{value: Package}>()
);

// Package installation actions
export const installPackage = createAction(
    '[Install] Install package triggered.',
    props<{value: any}>()
);

export const installPackageComplete = createAction(
    '[Install] Install package completed.'
)
