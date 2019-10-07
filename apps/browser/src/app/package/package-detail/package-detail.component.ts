import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Package } from '../../model/package.model';
import { ApplicationState } from '../../state';
import { Store, select } from '@ngrx/store';
import { getCurrentPackage } from '../../state/state.selectors';
import { FormGroup, FormControl } from '@angular/forms';
import { installPackage } from '../../state/state.actions';
import { NpmInstallCommand } from 'libs/shared/src/index';

@Component({
  selector: 'npmb-package-detail',
  templateUrl: './package-detail.component.html',
  styleUrls: ['./package-detail.component.less']
})
export class PackageDetailComponent implements OnInit, OnDestroy {
  package$: Observable<Package>;

  packageInstallForm = new FormGroup({
    name: new FormControl(),
    version: new FormControl()
  });

  packageSubscription: Subscription;

  constructor(private store: Store<ApplicationState>) {
    this.package$ = this.store.pipe(select(getCurrentPackage));

    this.packageSubscription = this.package$.subscribe(npmPackage => {
      if (!npmPackage)
        return;

      this.packageInstallForm.setValue({
        name: npmPackage.name,
        version: npmPackage.distTags.latest
      });
    });
  }

  ngOnInit() {
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
