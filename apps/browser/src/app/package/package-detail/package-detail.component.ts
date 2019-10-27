import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { Package } from '../../model/package.model';
import { ApplicationState } from '../../state';
import { Store, select } from '@ngrx/store';
import { getCurrentPackage, getInstallingPackage, getInstalledPackages } from '../../state/state.selectors';
import { FormGroup, FormControl } from '@angular/forms';
import { installPackage } from '../../state/state.actions';
import { NpmInstallCommand } from 'libs/shared/src/index';
import { map } from 'rxjs/operators';
import * as semver from 'semver';

@Component({
  selector: 'npmb-package-detail',
  templateUrl: './package-detail.component.html',
  styleUrls: ['./package-detail.component.less']
})
export class PackageDetailComponent implements OnInit, OnDestroy {
  package$: Observable<Package>;
  installingPackage$: Observable<boolean>;

  selectedVersion$: Observable<semver.SemVer>;
  installedVersion$: Observable<semver.Range>;

  packageInstallForm = new FormGroup({
    name: new FormControl(),
    version: new FormControl()
  });

  packageSubscription: Subscription;

  constructor(private store: Store<ApplicationState>) { }

  ngOnInit() {
    this.package$ = this.store.pipe(select(getCurrentPackage));
    this.installingPackage$ = this.store.pipe(select(getInstallingPackage));

    this.installedVersion$ = combineLatest(this.store.pipe(select(getInstalledPackages)), this.package$)
      .pipe(
        map(([installedPackages, currentPackage]) => {
          if (currentPackage.name in installedPackages) {
            return new semver.Range(installedPackages[currentPackage.name], true);
          } else {
            return null;
          }
        })
      );

    this.packageSubscription = this.package$.subscribe(npmPackage => {
      if (!npmPackage)
        return;

      this.packageInstallForm.setValue({
        name: npmPackage.name,
        version: npmPackage.distTags.latest
      });
    });

    this.selectedVersion$ = this.packageInstallForm.get('version').valueChanges.pipe(map(version => {
      if (!version) {
        return null;
      } else {
        return semver.parse(version, true);
      }
    }));
  }

  installPackage() {
    if (!this.packageInstallForm.valid)
      return;

    const value = this.packageInstallForm.value;

    const installCommand = new NpmInstallCommand(value.name, value.version);

    this.store.dispatch(installPackage({ value: installCommand }));
  }

  ngOnDestroy() {
    this.packageSubscription.unsubscribe();
  }
}
