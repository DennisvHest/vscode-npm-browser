import { Command } from "./command";

export interface TerminalCommand extends Command {
    runAsVSCodeTask: boolean;
    command: string;
}