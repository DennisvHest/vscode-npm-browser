export class PackageJson {
    filePath: string;
    name: string;
    version: string;
    description: string;
    dependencies: { [name: string]: string; };
}