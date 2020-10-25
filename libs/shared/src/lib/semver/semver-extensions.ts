import * as semver from 'semver';

export function applyRangeOptions(version: string, updateLevel: number): semver.Range {
    version = semver.coerce(version)!.raw;

    let prefix = '';

    switch (updateLevel) {
        case 1: prefix = '>='; break;
        case 2: prefix = '^'; break;
        case 3: prefix = '~'; break;
    }

    return new semver.Range(prefix + version);
}

export function getUpdateLevelFromRangeOption(range: semver.Range): number {
    if (range.raw.startsWith(">"))
        return 1;

    if (range.raw.startsWith("^"))
        return 2;

    if (range.raw.startsWith("~"))
        return 1;
    
    return 0;
}