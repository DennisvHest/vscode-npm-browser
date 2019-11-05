export class PackageJson {
    filePath: string;
    name: string;
    version: string;
    description: string;
    dependencies: { [name: string]: string; };
    devDependencies: { [name: string]: string; };
    optionalDependencies: { [name: string]: string; };
}