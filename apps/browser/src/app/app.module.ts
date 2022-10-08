import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { NgbModule, NgbTabsetModule, NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MarkdownModule } from 'ngx-markdown';

import { AppComponent } from './app.component';
import { SearchComponent } from './package/search/search.component';
import { PackageListComponent } from './package/package-list/package-list.component';
import { PackageDetailComponent } from './package/package-detail/package-detail.component';
import { StoreModule } from '@ngrx/store';
import { reducers, initialState } from './state';
import { EffectsModule } from '@ngrx/effects';
import { ApplicationStateEffects } from './state/state.effects';
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCube, faInfoCircle, faCheckCircle, faCog, faTrash } from '@fortawesome/free-solid-svg-icons';
import { VSCodeService } from './vscode/vscode.service';
import { AppRoutingModule } from './app-routing.module';
import { PackageJsonSelectorComponent } from './settings/package-json-selector/package-json-selector.component';
import { LayoutComponent } from './layout/layout.component';
import { IsGreaterThanPipe } from './pipes/is-greater-than.pipe';
import { EqualsPipe } from './pipes/equals.pipe';
import { IsLessThanPipe } from './pipes/is-less-than.pipe';

@NgModule({
  declarations: [
    AppComponent,
    SearchComponent,
    PackageListComponent,
    PackageDetailComponent,
    PackageJsonSelectorComponent,
    LayoutComponent,
    IsGreaterThanPipe,
    EqualsPipe,
    IsLessThanPipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    StoreModule.forRoot(reducers, { initialState }),
    EffectsModule.forRoot([ApplicationStateEffects]),
    LoadingBarHttpClientModule,
    NgbModule,
    NgbTabsetModule,
    NgbModalModule,
    NgbPaginationModule,
    MarkdownModule.forRoot(),
    ReactiveFormsModule,
    FontAwesomeModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary, private vsCodeService: VSCodeService /** Injecting into AppModule to setup messageing with VSCode. */) {
    library.addIcons(faCube, faInfoCircle, faCheckCircle, faCog, faTrash);
  }
}
