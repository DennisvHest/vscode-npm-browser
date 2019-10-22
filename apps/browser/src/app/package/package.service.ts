import { Injectable } from '@angular/core';
import { PackageSearchResult } from '../model/package-search-result.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Package } from '../model/package.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PackageService {

  private baseUrl = 'https://registry.npmjs.org';

  constructor(private http: HttpClient) { }

  search(searchText: string, page: number): Observable<PackageSearchResult> {
    return this.http.get<PackageSearchResult>(`${this.baseUrl}/-/v1/search`, {
      params: {
        text: searchText,
        size: (20).toString(),
        from: ((page - 1) * 20).toString()
      }
    });
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

        return npmPackage as Package;
      })
    );
  }
}
