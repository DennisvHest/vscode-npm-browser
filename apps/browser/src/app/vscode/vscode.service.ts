import { Injectable } from '@angular/core';
import { ApplicationState } from '../state';
import { CommandTypes, ValueCommand } from 'libs/shared/src';
import { Store } from '@ngrx/store';
import { installPackageComplete, packageJsonUpdated, uninstallPackageComplete, packageJsonsUpdated, selectedPackageChanged, packageFetched, packageUpdatesFound } from '../state/state.actions';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VSCodeService {

  private webResponse$: BehaviorSubject<any>;

  constructor(private store: Store<ApplicationState>) {
    window.addEventListener('message', event => {
      switch (event.data.type) {
        case CommandTypes.npmInstallComplete: this.store.dispatch(installPackageComplete()); break;
        case CommandTypes.npmUninstallComplete: this.store.dispatch(uninstallPackageComplete()); break;
        case CommandTypes.packageJsonUpdated: this.store.dispatch(packageJsonUpdated({ value: (event.data as ValueCommand).value })); break;
        case CommandTypes.packageJsonsUpdated: this.store.dispatch(packageJsonsUpdated({ value: (event.data as ValueCommand).value })); break;
        case CommandTypes.installedPackageSelected: this.store.dispatch(selectedPackageChanged({ value: (event.data as ValueCommand).value })); break;
        case CommandTypes.fetchPackageComplete: this.store.dispatch(packageFetched({ value: (event.data as ValueCommand).value })); break;
        case CommandTypes.npmOutdated: this.store.dispatch(packageUpdatesFound({ value: (event.data as ValueCommand).value })); break;
        case CommandTypes.webResponseCommand: this.processWebResponseCommand(event.data); break;
      }
    });
  }

  postCommand(command: any) {
    vscode.postMessage(command);
  }

  postWebRequestCommand(command: ValueCommand): Observable<any> {
    vscode.postMessage(command);

    this.webResponse$ = new BehaviorSubject<any>(null);

    return this.webResponse$;
  }

  processWebResponseCommand(command: ValueCommand) {
    this.webResponse$.next(command.value);
    this.webResponse$.complete();
  }

  getState(): ApplicationState {
    return vscode.getState();
  }

  getWorkspaceState(): VSCodeWorkspace {
    return workspaceState;
  }

  setState(state: ApplicationState) {
    vscode.setState(state);
  }
}
