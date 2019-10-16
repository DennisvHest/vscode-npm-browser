import { Command } from "./command";

export interface ValueCommand extends Command {
    value: any;
}