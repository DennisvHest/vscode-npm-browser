import { TerminalCommand } from "./terminal-command";

export class NpmUninstallCommand implements TerminalCommand {
    type = 'npm-uninstall';

    command: string;

    constructor(
        public packageName: string
    ) {
        this.command = `npm uninstall ${this.packageName}`;
    }
}