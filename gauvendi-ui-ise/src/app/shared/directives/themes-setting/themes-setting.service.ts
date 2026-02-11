import {BehaviorSubject, Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {themesColorConfig} from "@app/shared/directives/themes-setting/themes-setting.const";

@Injectable()
export class ThemesSettingService {
  activeTheme = new BehaviorSubject<object>(themesColorConfig);

  getActiveTheme(): Observable<object> {
    return this.activeTheme.asObservable();
  }

  setActiveTheme(themes: object): void {
    this.activeTheme.next(themes);
  }
}
