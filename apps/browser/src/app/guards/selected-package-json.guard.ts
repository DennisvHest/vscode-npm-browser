import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ApplicationState } from '../state';
import { Store, select } from '@ngrx/store';
import { getSelectedPackageJson } from '../state/state.selectors';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SelectedPackageJsonGuard implements CanActivate {

  constructor(private store: Store<ApplicationState>, private router: Router) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.store.pipe(
      select(getSelectedPackageJson),
      map(packageJson => {
        return packageJson != null || this.router.createUrlTree(['/package-json-select']);
      })
    );
  }

}
