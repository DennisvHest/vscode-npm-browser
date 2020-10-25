import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { withLatestFrom, map, mergeMap, tap } from 'rxjs/operators';
import { ApplicationState } from '.';
import { Store } from '@ngrx/store';
import { selectedPackageChanged, currentPackageLoaded, installPackage, packageJsonSelected, uninstallPackage, packageFetched } from './state.actions';
import { PackageService } from '../package/package.service';
import { VSCodeService } from '../vscode/vscode.service';

@Injectable()
export class ApplicationStateEffects {

    saveVSCodeState$ = createEffect(() => this.actions$.pipe(
        withLatestFrom(this.store$),
        map(([action, state]) => {
            this.vsCodeService.setState(state);
        })
    ), { dispatch: false });

    loadCurrentPackage$ = createEffect(() => this.actions$.pipe(
        ofType(selectedPackageChanged),
        tap(action => this.packageService.getPackage(action.value))
    ), { dispatch: false });

    mapFetchedPackage$ = createEffect(() => this.actions$.pipe(
        ofType(packageFetched),
        mergeMap(action => this.packageService.mapFetchedPackage(action.value)
            .pipe(
                map(resultPackage => currentPackageLoaded({ value: resultPackage }))
            ))
    ));

    vsCodeMessages$ = createEffect(() => this.actions$.pipe(
        ofType(installPackage, uninstallPackage, packageJsonSelected),
        map(action => this.vsCodeService.postCommand(action.value))
    ), { dispatch: false });

    constructor(
        private actions$: Actions,
        private store$: Store<ApplicationState>,
        private packageService: PackageService,
        private vsCodeService: VSCodeService
    ) { }
}
