import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { PackageService } from '../package.service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PackageSearchResult } from '../../model/package-search-result.model';
import { SearchPackage } from '../../model/search-package.model';
import { Store, select } from '@ngrx/store';
import { ApplicationState } from '../../state';
import { packageSearchResultChanged, selectedPackageChanged } from '../../state/state.actions';
import { getPackageSearchResult, getSelectedPackageName } from '../../state/state.selectors';
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

  @ViewChild('searchTextInput', { static: false }) searchTextInput: ElementRef;

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
    this.searchForm.setValue({ searchText: 'bootstrap' });
    this.search();

    this.store.dispatch(selectedPackageChanged({ value: 'react-bootstrap' }));
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

    this.packageService.search(query.searchText, this.page).subscribe(result => {
      this.store.dispatch(packageSearchResultChanged({ value: result }));
    });

    this.previousSearchQuery = query;
  }

  onPackageSelected(searchPackage: SearchPackage) {
    this.store.dispatch(selectedPackageChanged({ value: searchPackage.name }));
  }
}
