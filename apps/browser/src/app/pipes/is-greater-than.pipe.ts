import { Pipe, PipeTransform } from '@angular/core';
import * as semver from 'semver';

@Pipe({
  name: 'isGreaterThan'
})
export class IsGreaterThanPipe implements PipeTransform {

  transform(semver1: semver.SemVer, semver2: semver.Range): boolean {
    return semver.gt(semver1, semver2.set[0][0].semver);
  }

}
