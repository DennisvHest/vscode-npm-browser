import { CommandTypes } from "./command";
import { TerminalCommand } from "./terminal-command";

export class NpmOutdatedCommand implements TerminalCommand {
    runAsVSCodeTask: boolean;
    command: string;
    type: string;

    constructor() {
        this.type = CommandTypes.npmOutdated;
        this.command = `npm outdated --json`
    }
}