import { Component, OnInit, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { ApplicationState } from '../../state';
import { Observable } from 'rxjs';
import { PackageJson } from 'libs/shared/src';
import { getPackageJsons } from '../../state/state.selectors';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'npmb-package-json-selector',
  templateUrl: './package-json-selector.component.html',
  styleUrls: ['./package-json-selector.component.less']
})
export class PackageJsonSelectorComponent implements OnInit, AfterViewInit {

  packageJsons$: Observable<PackageJson[]>;

  selectedPackageJson: PackageJson;

  @ViewChild('packageJsonSelectModal', { static: false }) packageJsonSelectModal: TemplateRef<any>;

  constructor(private store: Store<ApplicationState>, private modalService: NgbModal) { }

  ngOnInit() {
    this.packageJsons$ = this.store.pipe(select(getPackageJsons));
  }

  ngAfterViewInit() {
    this.modalService.open(this.packageJsonSelectModal, { 
      centered: true, 
      size: 'sm', 
      beforeDismiss: () => false
    });
  }

  selectPackageJson(packageJson: PackageJson) {
    this.selectedPackageJson = packageJson;
  }
}
