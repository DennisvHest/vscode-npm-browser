import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
export class SearchComponent implements OnInit, AfterViewInit {

  searchResult$: Observable<PackageSearchResult>;
  packages$: Observable<SearchPackage[]>;

  currentPackageName$: Observable<string>;

  @ViewChild('searchTextInput', { static: false }) searchTextInput: ElementRef;

  searchForm = new FormGroup({
    searchText: new FormControl('')
  });

  constructor(private packageService: PackageService, private store: Store<ApplicationState>) {
    this.searchResult$ = this.store.pipe(select(getPackageSearchResult));
    this.currentPackageName$ = this.store.pipe(select(getSelectedPackageName));

    this.packages$ = this.searchResult$.pipe(
      map(result => result.objects.map(item => item.package)),
    );
  }

  ngOnInit() {
    this.store.dispatch(selectedPackageChanged({ value: 'react-bootstrap' }));
  }

  ngAfterViewInit() {
    this.searchTextInput.nativeElement.focus();
  }

  search() {
    if (!this.searchForm.valid)
      return;

    this.packageService.search(this.searchForm.value.searchText).subscribe(result => {
      this.store.dispatch(packageSearchResultChanged({ value: result }));
    });
  }

  onPackageSelected(searchPackage: SearchPackage) {
    this.store.dispatch(selectedPackageChanged({ value: searchPackage.name }));
  }
}
