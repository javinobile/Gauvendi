import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ThemesSettingDirective} from './themes-setting.directive';
import {ThemesSettingService} from './themes-setting.service';

@NgModule({
  declarations: [
    ThemesSettingDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ThemesSettingDirective
  ],
  providers: [
    ThemesSettingService
  ]
})
export class ThemesSettingModule {}
