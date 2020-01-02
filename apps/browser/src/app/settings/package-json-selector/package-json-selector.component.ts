import { Component, OnInit, ViewChild, TemplateRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { ApplicationState } from '../../state';
import { Observable, combineLatest, Subscription } from 'rxjs';
import { PackageJson, CommandTypes, ValueCommand, VSCodeToastCommand } from 'libs/shared/src';
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
export class PackageJsonSelectorComponent implements OnInit, AfterViewInit, OnDestroy {

  modal: NgbModalRef;

  canCloseModal: boolean = true;

  packageJsons$: Observable<PackageJson[]>;

  chosenPackageJson: PackageJson;
  selectedPackageJson$: Observable<PackageJson>;

  packageJsonsSubscription: Subscription;

  @ViewChild('packageJsonSelectModal', { static: false }) packageJsonSelectModal: TemplateRef<any>;

  constructor(
    private store: Store<ApplicationState>,
    private modalService: NgbModal,
    private vsCodeService: VSCodeService
  ) { }

  ngOnInit() {
    this.packageJsons$ = this.store.pipe(select(getPackageJsons));
    this.selectedPackageJson$ = this.store.pipe(select(getSelectedPackageJson));
  }

  ngAfterViewInit() {
    this.packageJsonsSubscription = combineLatest(this.selectedPackageJson$, this.packageJsons$)
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
        this.openModal(false);
      });
  }

  openModal(canCloseModal: boolean = true) {
    this.canCloseModal = canCloseModal;

    this.modal = this.modalService.open(this.packageJsonSelectModal, {
      centered: true,
      size: 'sm',
      beforeDismiss: () => {
        if (this.canCloseModal) {
          // Reset package.json selection to the currently selected package.json
          this.selectedPackageJson$.pipe(take(1))
            .subscribe(selectedPackageJson => this.chosenPackageJson = selectedPackageJson);
        }

        return this.canCloseModal;
      },
    });
  }

  closeModal() {
    if (this.modal)
      this.modal.close();

    this.canCloseModal = true;
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

    this.closeModal();
  }

  ngOnDestroy() {
    this.packageJsonsSubscription.unsubscribe();
  }
}
