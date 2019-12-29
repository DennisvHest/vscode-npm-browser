import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { PackageService } from '../package.service';
import { Observable } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';
import { PackageSearchResult } from '../../model/package-search-result.model';
import { SearchPackage } from '../../model/search-package.model';
import { Store, select } from '@ngrx/store';
import { ApplicationState } from '../../state';
import { packageSearchResultChanged, selectedPackageChanged } from '../../state/state.actions';
import { getPackageSearchResult, getSelectedPackageName, getPackageSearchQuery } from '../../state/state.selectors';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'npmb-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.less']
})
export class SearchComponent implements OnInit {

  searchResult$: Observable<PackageSearchResult>;
  packages$: Observable<SearchPackage[]>;

  currentPackageName$: Observable<string>;

  searchForm = new FormGroup({
    searchText: new FormControl('')
  });

  page = 1;

  previousSearchQuery: any;

  constructor(private packageService: PackageService, private store: Store<ApplicationState>, private cd: ChangeDetectorRef) {
    this.searchResult$ = this.store.pipe(select(getPackageSearchResult));
    this.currentPackageName$ = this.store.pipe(select(getSelectedPackageName));

    this.packages$ = this.searchResult$.pipe(
      map(result => result.objects.map(item => item.package)),
    );
  }

  ngOnInit() {
    this.store.select(getPackageSearchQuery).pipe(take(1)).subscribe(query => {
      this.searchForm.patchValue(query);
      this.page = query.page;
      this.search();
    })
  }

  search() {
    if (!this.searchForm.valid)
      return;

    const query = this.searchForm.value;

    if (this.previousSearchQuery && this.previousSearchQuery.searchText !== query.searchText) {
      this.page = 1;

      // Manually triggering change detection because it is not done automatically when setting this.page for some reason.
      this.cd.detectChanges()
    }

    this.packageService.search({ searchText: query.searchText, page: this.page }).subscribe();

    this.previousSearchQuery = query;
  }

  onPackageSelected(searchPackage: SearchPackage) {
    this.store.dispatch(selectedPackageChanged({ value: searchPackage.name }));
  }
}
