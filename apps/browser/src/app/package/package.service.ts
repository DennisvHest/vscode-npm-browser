import { Injectable } from '@angular/core';
import { PackageSearchResult } from '../model/package-search-result.model';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Package } from '../model/package.model';
import { map, tap, catchError } from 'rxjs/operators';
import { ApplicationState } from '../state';
import { Store } from '@ngrx/store';
import { packageSearchResultChanged, packageSearchQueryChanged } from '../state/state.actions';
import { VSCodeService } from '../vscode/vscode.service';
import { VSCodeToastCommand, ToastLevels } from 'libs/shared/src';

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
      catchError(error =>  {
        this.reportRequestError(error);

        return of(null);
      })
    );
  }

  getPackage(name: string): Observable<Package> {
    return this.http.get<Package>(`${this.baseUrl}/${name}`).pipe(
      map((npmPackage: any) => {
        npmPackage.distTags = npmPackage['dist-tags'];

        // Map versions to an array of version objects instead of a property per version.
        npmPackage.versions = Object.keys(npmPackage.versions).map(v => {
          const version = npmPackage.versions[v];

          // Add the distTags of a version to the version
          version.distTags = Object.keys(npmPackage.distTags).filter(t => npmPackage.distTags[t] === version.version);

          return version;
        });

        const returnNpmPackage = npmPackage as Package;

        if (!returnNpmPackage.author)
          returnNpmPackage.author = null;

        return npmPackage as Package;
      }),
      catchError(error =>  {
        this.reportRequestError(error);

        return of(null);
      })
    );
  }

  private reportRequestError(error) {
    this.vsCodeService.postCommand(new VSCodeToastCommand(`Request to NPM Registry failed (HTTP Status: ${error.status}).`, ToastLevels.error))
  }
}
