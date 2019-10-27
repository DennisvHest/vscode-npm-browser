import { Pipe, PipeTransform } from '@angular/core';
import * as semver from 'semver';

@Pipe({
  name: 'isLessThan'
})
export class IsLessThanPipe implements PipeTransform {

  transform(semver1: semver.SemVer, semver2: semver.Range): boolean {
    return semver.lt(semver1, semver2.set[0][0].semver);
  }

}
