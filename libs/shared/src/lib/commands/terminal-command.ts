import { Command } from "./command";

export interface TerminalCommand extends Command {
    command: string;
}