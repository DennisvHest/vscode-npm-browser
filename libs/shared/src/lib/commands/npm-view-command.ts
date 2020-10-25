import { CommandTypes } from './command';
import { TerminalCommand } from "./terminal-command";

export class NpmViewCommand implements TerminalCommand {
    runAsVSCodeTask: boolean;
    command: string;
    type: string;

    constructor(packageName: string) {
        this.type = CommandTypes.fetchPackage;
        this.command = `npm view ${packageName} --json`
    }
}