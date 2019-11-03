import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { Package } from '../../model/package.model';
import { ApplicationState } from '../../state';
import { Store, select } from '@ngrx/store';
import { getCurrentPackage, getInstallingPackage, getInstalledPackages, getUninstallingPackage } from '../../state/state.selectors';
import { FormGroup, FormControl } from '@angular/forms';
import { installPackage, uninstallPackage } from '../../state/state.actions';
import { NpmInstallCommand, NpmUninstallCommand } from 'libs/shared/src/index';
import { map } from 'rxjs/operators';
import * as semver from 'semver';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'npmb-package-detail',
  templateUrl: './package-detail.component.html',
  styleUrls: ['./package-detail.component.less']
})
export class PackageDetailComponent implements OnInit, OnDestroy {
  package$: Observable<Package>;
  npmPackage: Package;
  installingPackage$: Observable<boolean>;
  uninstallingPackage$: Observable<boolean>;

  selectedVersion$: Observable<semver.SemVer>;
  installedVersion$: Observable<semver.Range>;

  packageInstallForm = new FormGroup({
    name: new FormControl(),
    version: new FormControl(),
    updateLevel: new FormControl(3)
  });

  packageSubscription: Subscription;

  constructor(private store: Store<ApplicationState>, private modalService: NgbModal) { }

  ngOnInit() {
    this.package$ = this.store.pipe(select(getCurrentPackage));
    this.installingPackage$ = this.store.pipe(select(getInstallingPackage));
    this.uninstallingPackage$ = this.store.pipe(select(getUninstallingPackage));

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

      this.npmPackage = npmPackage;

      this.packageInstallForm.patchValue({
        name: npmPackage.name,
        version: npmPackage.distTags.latest,
        updateLevel: 3
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

  openInstallationOptionsModal(content) {
    this.modalService.open(content, { size: 'sm', centered: true });
  }

  installPackage() {
    if (!this.packageInstallForm.valid)
      return;

    const value = this.packageInstallForm.value;

    const installCommand = new NpmInstallCommand({
      packageName: value.name,
      packageVersion: value.version,
      updateLevel: value.updateLevel
    });

    this.store.dispatch(installPackage({ value: installCommand }));
  }

  uninstallPackage() {
    const uninstallCommand = new NpmUninstallCommand(this.npmPackage.name);

    this.store.dispatch(uninstallPackage({ value: uninstallCommand }));
  }

  ngOnDestroy() {
    this.packageSubscription.unsubscribe();
  }
}
