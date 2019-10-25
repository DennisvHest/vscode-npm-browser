import { TerminalCommand } from "./terminal-command";

export class NpmInstallCommand implements TerminalCommand {
    type = 'npm-install';

    command: string;

    constructor(
        public packageName: string,
        public packageVersion: string
    ) {
        this.command = `npm install ${this.packageName}@${this.packageVersion}`;
    }
}