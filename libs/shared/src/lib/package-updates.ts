import { SemVer } from 'semver';

export class PackageUpdatesItem {
    current: SemVer;
    wanted: SemVer;
    latest: SemVer;
    location: string;

    get hasUpdateInRange(): boolean {
        if (!this.current)
            return false;

        return this.current.compare(this.wanted) === -1;
    }

    get hasUpdate(): boolean {
        if (!this.current)
            return false;

        return this.current.compare(this.latest) === -1;
    }

    constructor(item: any) {
        if (item.current)
            this.current = new SemVer(item.current);
            
        this.wanted = new SemVer(item.wanted);
        this.latest = new SemVer(item.latest);
        this.location = item.location;
    }
}