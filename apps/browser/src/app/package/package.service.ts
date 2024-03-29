import { Injectable } from '@angular/core';
import { PackageSearchResult } from '../model/package-search-result.model';
import { HttpClient, HttpRequest } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Package } from '../model/package.model';
import { map, tap, catchError, withLatestFrom, take, filter } from 'rxjs/operators';
import { ApplicationState } from '../state';
import { Store } from '@ngrx/store';
import { packageSearchResultChanged, packageSearchQueryChanged } from '../state/state.actions';
import { VSCodeService } from '../vscode/vscode.service';
import { VSCodeToastCommand, ToastLevels, NpmViewCommand, ValueCommand, CommandTypes } from 'libs/shared/src';
import { getFetchedPackage } from '../state/state.selectors';

@Injectable({
  providedIn: 'root'
})
export class PackageService {

  private readonly baseUrl = 'https://registry.npmjs.org';
  private readonly pageSize = 20;

  constructor(private http: HttpClient, private store: Store<ApplicationState>, private vsCodeService: VSCodeService) { }

  search(query: PackageSearchQuery): Observable<PackageSearchResult> {
    this.store.dispatch(packageSearchQueryChanged({ value: query }));

    return this.http.get<PackageSearchResult>(`${this.baseUrl}/-/v1/search`, {
      params: {
        text: query.searchText,
        size: this.pageSize.toString(),
        from: ((query.page - 1) * this.pageSize).toString()
      }
    }).pipe(
      tap(result => {
        this.store.dispatch(packageSearchResultChanged({ value: result }));
      }),
      catchError(error => {
        this.reportRequestError(error);

        return of(null);
      })
    );
  }

  getPackage(name: string) {
    this.vsCodeService.postCommand(new NpmViewCommand(name));
  }

  mapFetchedPackage(npmViewPackage: any): Observable<Package> {
    // const registryRequest = this.http.get<any>(`${this.baseUrl}/${npmViewPackage.name}`).pipe(
    //   catchError((error) => {
    //     if (error.status !== 404)
    //       this.reportRequestError(error);

    //     return of(null);
    //   })
    // );

    const registryRequest = this.vsCodeService.postWebRequestCommand({
      type: CommandTypes.webRequestCommand,
      value: new HttpRequest('GET', `${this.baseUrl}/${npmViewPackage.name}`)
    } as ValueCommand);

    return registryRequest.pipe(
      filter(registryPackage => registryPackage != null),
      map(registryPackage => {
        npmViewPackage.distTags = npmViewPackage['dist-tags'];

        // Map versions to an array of version objects instead of a property per version.
        npmViewPackage.versions = Object.keys(npmViewPackage.versions).map(v => {
          const version = { version: npmViewPackage.versions[v], distTags: [] };

          // Add the distTags of a version to the version
          version.distTags = Object.keys(npmViewPackage.distTags).filter(t => npmViewPackage.distTags[t] === version.version);

          return version;
        });

        if (typeof npmViewPackage.author === 'object' && npmViewPackage.author !== null)
          npmViewPackage.author = '';

        npmViewPackage.author = { name: npmViewPackage.author };

        const returnNpmPackage = npmViewPackage as Package;

        if (!returnNpmPackage.author)
          returnNpmPackage.author = null;

        if (registryPackage && registryPackage.status === 200) {
          const versions = Object.keys(registryPackage.versions);

          const latestVersion = registryPackage.versions[versions[versions.length - 1]];

          if (latestVersion) {
            let readme = registryPackage.readme;

            if (!readme) // Sometimes the readme field is empty even tough the latest version does have readme (problem with NPM registry?)
              readme = latestVersion.readme;

              returnNpmPackage.readme = readme;
          }

          if (registryPackage.author)
            returnNpmPackage.author = registryPackage.author;

          returnNpmPackage.isPrivate = false;
        } else {
          returnNpmPackage.isPrivate = true;
          returnNpmPackage.readme = null;
        }

        return returnNpmPackage as Package;
      })
    )
  }

  private reportRequestError(error) {
    this.vsCodeService.postCommand(new VSCodeToastCommand(`Request to NPM Registry failed (HTTP Status: ${error.status}).`, ToastLevels.error));
  }
}
