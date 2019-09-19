import { Author } from './author.model';
import { Version } from './version.model';
import { DistributionTags } from './DistributionTags.model';

export class Package {
    name: string;
    description: string;
    readme: string;
    distTags: DistributionTags;
    author: Author;
    versions: Version[];
}
