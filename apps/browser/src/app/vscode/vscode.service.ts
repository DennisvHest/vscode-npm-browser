import { Injectable } from '@angular/core';
import { ApplicationState } from '../state';
import { CommandTypes } from 'libs/shared/src';
import { Store } from '@ngrx/store';
import { installPackageComplete } from '../state/state.actions';

@Injectable({
  providedIn: 'root'
})
export class VSCodeService {

  constructor(private store: Store<ApplicationState>) {
    window.addEventListener('message', event => {
      switch (event.data.type) {
        case CommandTypes.npmInstallComplete: this.store.dispatch(installPackageComplete()); break;
      }
    });
  }

  postCommand(command: any) {
    vscode.postMessage(command);
  }

  getState(): ApplicationState {
    return vscode.getState();
  }

  setState(state: ApplicationState) {
    vscode.setState(state);
  }
}
