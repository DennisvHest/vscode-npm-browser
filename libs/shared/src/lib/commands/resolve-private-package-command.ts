import { Command } from './command';


export class ResolvePrivatePackageCommand implements Command {
    readonly type = 'resolve-private-package-command';

    constructor(
        public requestId: string, 
        public packageId: string
    ) { }
}