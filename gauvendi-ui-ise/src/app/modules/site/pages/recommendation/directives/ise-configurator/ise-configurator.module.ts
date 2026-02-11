import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IseConfiguratorDirective
} from "@app/modules/site/pages/recommendation/directives/ise-configurator/ise-configurator.directive";
import {
  IseConfiguratorManagementComponent
} from "@app/modules/site/pages/recommendation/directives/ise-configurator/components/ise-configurator-management/ise-configurator-management.component";
import {HotelTagStoreModule} from "@store/hotel-tag/hotel-tag-store.module";



@NgModule({
  declarations: [
    IseConfiguratorDirective
  ],
  exports: [
    IseConfiguratorDirective
  ],
  imports: [
    CommonModule,
    IseConfiguratorManagementComponent,
    HotelTagStoreModule
  ]
})
export class IseConfiguratorModule { }
