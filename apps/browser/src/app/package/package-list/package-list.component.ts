import { Component, OnInit, Input, OnChanges, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { SearchPackage } from '../../model/search-package.model';

@Component({
  selector: 'npmb-package-list',
  templateUrl: './package-list.component.html',
  styleUrls: ['./package-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PackageListComponent implements OnInit {

  @Input() packages: SearchPackage[] = [];
  @Input() activePackageName: string;
  @Output() packageSelected = new EventEmitter<SearchPackage>();

  constructor() { }

  ngOnInit() {
  }

  onPackageSelect(searchPackage: SearchPackage) {
    this.packageSelected.emit(searchPackage);
  }
}
