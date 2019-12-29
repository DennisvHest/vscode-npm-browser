import { TerminalCommand } from "./terminal-command";
import { PackageType } from '../..';

export interface PackageInstallationCommand extends TerminalCommand {
    packageName: string;
    packageType: PackageType;
}