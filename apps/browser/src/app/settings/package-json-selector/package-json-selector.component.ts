import { Component, OnInit, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { ApplicationState } from '../../state';
import { Observable, combineLatest } from 'rxjs';
import { PackageJson, CommandTypes, ValueCommand, VSCodeToastCommand, ToastLevels } from 'libs/shared/src';
import { getPackageJsons, getSelectedPackageJson } from '../../state/state.selectors';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { packageJsonSelected } from '../../state/state.actions';
import { take } from 'rxjs/operators';
import { VSCodeService } from '../../vscode/vscode.service';

@Component({
  selector: 'npmb-package-json-selector',
  templateUrl: './package-json-selector.component.html',
  styleUrls: ['./package-json-selector.component.less']
})
export class PackageJsonSelectorComponent implements OnInit, AfterViewInit {

  modal: NgbModalRef;

  packageJsons$: Observable<PackageJson[]>;

  chosenPackageJson: PackageJson;

  @ViewChild('packageJsonSelectModal', { static: false }) packageJsonSelectModal: TemplateRef<any>;

  constructor(
    private store: Store<ApplicationState>,
    private modalService: NgbModal,
    private vsCodeService: VSCodeService
  ) { }

  ngOnInit() {
    this.packageJsons$ = this.store.pipe(select(getPackageJsons));
  }

  ngAfterViewInit() {
    combineLatest(this.store.pipe(select(getSelectedPackageJson)), this.packageJsons$).pipe(take(1))
      .subscribe(([selectedPackageJson, packageJsons]) => {

        if (selectedPackageJson) {
          // Selected package.json was saved in workspace 
          this.selectPackageJson(selectedPackageJson);
          return;
        }

        if (packageJsons.length === 1) {
          // Only one package.json in the workspaces, so select that one.
          this.selectPackageJson(packageJsons[0]);
          this.save();

          const toastMessage = new VSCodeToastCommand(`
            Found package.json for '${this.chosenPackageJson.name}'. Packages will be installed to that package.json. 
            Location: ${this.chosenPackageJson.filePath}
          `);

          this.vsCodeService.postCommand(toastMessage);
          return;
        }

        // Multiple package.json files found. User has to select one.
        this.modal = this.modalService.open(this.packageJsonSelectModal, {
          centered: true,
          size: 'sm',
          beforeDismiss: () => false
        });
      });
  }

  selectPackageJson(packageJson: PackageJson) {
    this.chosenPackageJson = packageJson;
  }

  save() {
    if (!this.chosenPackageJson)
      return;

    const selectedPackageJsonCommand: ValueCommand = {
      type: CommandTypes.packageJsonSelected,
      value: this.chosenPackageJson
    };

    this.store.dispatch(packageJsonSelected({ value: selectedPackageJsonCommand }));

    if (this.modal)
      this.modal.close();
  }
}
