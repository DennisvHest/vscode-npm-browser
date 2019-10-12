import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { NgbModule, NgbTabsetModule } from '@ng-bootstrap/ng-bootstrap';
import { MarkdownModule } from 'ngx-markdown';

import { AppComponent } from './app.component';
import { SearchComponent } from './package/search/search.component';
import { PackageListComponent } from './package/package-list/package-list.component';
import { PackageDetailComponent } from './package/package-detail/package-detail.component';
import { CorsInterceptor } from './interceptors/cors.interceptor';
import { StoreModule } from '@ngrx/store';
import { reducers, initialState } from './state';
import { EffectsModule } from '@ngrx/effects';
import { ApplicationStateEffects } from './state/state.effects';
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCube, faInfoCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { VSCodeService } from './vscode/vscode.service';

@NgModule({
  declarations: [
    AppComponent,
    SearchComponent,
    PackageListComponent,
    PackageDetailComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    StoreModule.forRoot(reducers, { initialState }),
    EffectsModule.forRoot([ApplicationStateEffects]),
    LoadingBarHttpClientModule,
    NgbModule,
    NgbTabsetModule,
    MarkdownModule.forRoot(),
    ReactiveFormsModule,
    FontAwesomeModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CorsInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary, private vsCodeService: VSCodeService) {
    library.addIcons(faCube, faInfoCircle, faCheckCircle);
  }
}
