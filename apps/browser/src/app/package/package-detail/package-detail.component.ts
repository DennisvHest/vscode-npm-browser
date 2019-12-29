import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription, combineLatest, BehaviorSubject } from 'rxjs';
import { Package } from '../../model/package.model';
import { ApplicationState } from '../../state';
import { Store, select } from '@ngrx/store';
import { getCurrentPackage, getInstallingPackage, getInstalledPackages, getUninstallingPackage } from '../../state/state.selectors';
import { FormGroup, FormControl } from '@angular/forms';
import { installPackage, uninstallPackage } from '../../state/state.actions';
import { NpmInstallCommand, NpmUninstallCommand, InstalledPackage, PackageType } from 'libs/shared/src/index';
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

  selectedVersion$: semver.SemVer;

  installedVersion$: Observable<InstalledPackage>;
  installedVersion: InstalledPackage;

  packageInstallForm = new FormGroup({
    name: new FormControl(),
    version: new FormControl(),
    updateLevel: new FormControl(2),
    packageType: new FormControl(PackageType.Dependency)
  });

  packageSubscription: Subscription;
  selectedVersionSubscription: Subscription;

  PackageType = PackageType;

  constructor(private store: Store<ApplicationState>, private modalService: NgbModal) { }

  ngOnInit() {
    this.package$ = this.store.pipe(select(getCurrentPackage));
    this.installingPackage$ = this.store.pipe(select(getInstallingPackage));
    this.uninstallingPackage$ = this.store.pipe(select(getUninstallingPackage));

    this.installedVersion$ = combineLatest(this.store.pipe(select(getInstalledPackages)), this.package$)
      .pipe(
        map(([installedPackages, currentPackage]) => {
          if (!currentPackage)
            return null;

          const installedPackage = installedPackages.find(installedPackage => installedPackage.name === currentPackage.name);

          this.installedVersion = installedPackage;

          if (installedPackage) {
            return installedPackage;
          } else {
            return null;
          }
        })
      );

    this.packageSubscription = combineLatest(this.package$, this.installedVersion$).subscribe(([npmPackage, installedVersion]) => {
      if (!npmPackage)
        return;

      const packageChanged = !this.npmPackage || this.npmPackage.name !== npmPackage.name;

      this.npmPackage = npmPackage;

      if (packageChanged) {
        this.packageInstallForm.patchValue({
          name: npmPackage.name,
          version: npmPackage.distTags.latest,
          updateLevel: 2,
          packageType: installedVersion ? installedVersion.type : PackageType.Dependency
        });
      }
    });

    this.selectedVersionSubscription = this.packageInstallForm.get('version').valueChanges.pipe(map(version => {
      if (!version) {
        return null;
      } else {
        return semver.parse(version, true);
      }
    })).subscribe(version => {
      this.selectedVersion$ = version;
    });
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
      updateLevel: value.updateLevel,
      packageType: value.packageType
    });

    this.store.dispatch(installPackage({ value: installCommand }));
  }

  uninstallPackage() {
    const uninstallCommand = new NpmUninstallCommand(this.npmPackage.name, this.installedVersion.type);

    this.store.dispatch(uninstallPackage({ value: uninstallCommand }));
  }

  ngOnDestroy() {
    this.packageSubscription.unsubscribe();
    this.selectedVersionSubscription.unsubscribe();
  }
}
