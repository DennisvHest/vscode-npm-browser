import { Injectable } from '@angular/core';
//import { Command } from '../../../../shared/commands/command';
import { ApplicationState } from '../state';

@Injectable({
  providedIn: 'root'
})
export class VSCodeService {

  constructor() { }

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
