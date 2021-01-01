import { CommandTypes } from "./command";
import { TerminalCommand } from "./terminal-command";

export class NpmUpdateCommand implements TerminalCommand {
    runAsVSCodeTask: boolean;
    command: string;
    type: string;

    constructor() {
        this.runAsVSCodeTask = true;
        this.type = CommandTypes.npmUpdate;
        this.command = `npm update`
    }
}