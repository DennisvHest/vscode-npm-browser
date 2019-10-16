import { Component, OnInit, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { ApplicationState } from '../../state';
import { Observable } from 'rxjs';
import { PackageJson, CommandTypes, ValueCommand } from 'libs/shared/src';
import { getPackageJsons } from '../../state/state.selectors';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { packageJsonSelected } from '../../state/state.actions';
import { Router } from '@angular/router';

@Component({
  selector: 'npmb-package-json-selector',
  templateUrl: './package-json-selector.component.html',
  styleUrls: ['./package-json-selector.component.less']
})
export class PackageJsonSelectorComponent implements OnInit, AfterViewInit {

  modal: NgbModalRef;

  packageJsons$: Observable<PackageJson[]>;

  selectedPackageJson: PackageJson;

  @ViewChild('packageJsonSelectModal', { static: false }) packageJsonSelectModal: TemplateRef<any>;

  constructor(private store: Store<ApplicationState>, private router: Router, private modalService: NgbModal) { }

  ngOnInit() {
    this.packageJsons$ = this.store.pipe(select(getPackageJsons));
  }

  ngAfterViewInit() {
    this.modal = this.modalService.open(this.packageJsonSelectModal, {
      centered: true,
      size: 'sm',
      beforeDismiss: () => false
    });
  }

  selectPackageJson(packageJson: PackageJson) {
    this.selectedPackageJson = packageJson;
  }

  save() {
    if (!this.selectedPackageJson)
      return;

    const selectedPackageJsonCommand: ValueCommand = {
      type: CommandTypes.packageJsonSelected,
      value: this.selectedPackageJson
    };

    this.store.dispatch(packageJsonSelected({ value: selectedPackageJsonCommand }));

    this.modal.close();
    this.router.navigate(['/']);
  }
}
