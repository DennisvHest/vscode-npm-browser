import * as semver from 'semver';

export enum PackageType {
    Dependency,
    DevDependency,
    OptionalDependency
}

export class InstalledPackage {

    constructor(
        public name: string,
        private _version: string,
        public type: PackageType) {}

    get version(): semver.Range {
        if (!this._version) {
            return null;
        } else {
            return new semver.Range(this._version, true);
        }
    }
}