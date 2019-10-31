import { Injectable } from '@angular/core';
import { ApplicationState } from '../state';
import { CommandTypes, ValueCommand } from 'libs/shared/src';
import { Store } from '@ngrx/store';
import { installPackageComplete, packageJsonUpdated, uninstallPackageComplete } from '../state/state.actions';

@Injectable({
  providedIn: 'root'
})
export class VSCodeService {

  constructor(private store: Store<ApplicationState>) {
    window.addEventListener('message', event => {
      switch (event.data.type) {
        case CommandTypes.npmInstallComplete: this.store.dispatch(installPackageComplete()); break;
        case CommandTypes.npmUninstallComplete: this.store.dispatch(uninstallPackageComplete()); break;
        case CommandTypes.packageJsonUpdated: this.store.dispatch(packageJsonUpdated({ value: (event.data as ValueCommand).value })); break;
      }
    });
  }

  postCommand(command: any) {
    vscode.postMessage(command);
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
