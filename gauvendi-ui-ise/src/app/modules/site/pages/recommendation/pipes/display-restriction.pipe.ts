import {Pipe, PipeTransform} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {SectionCodeEnum} from '@app/store/multi-lang/multi-lang.state';
import {selectorSectionContent} from '@app/store/multi-lang/multi-lang.selectors';

@Pipe({
  name: 'displayRestriction',
  standalone: true
})
export class DisplayRestrictionPipe implements PipeTransform {
  constructor(private store: Store) {
  }

  transform(value: number): Observable<string> {
    return this.getTranslation(value > 1 ? 'nights' : 'night').pipe(map((translated) => `${value} ${translated}`));
  }

  getTranslation(value: string): Observable<string> {
    return this.store.pipe(
      select(selectorSectionContent(SectionCodeEnum.ISE)),
      map((data) => data?.find((item) => item?.key?.toUpperCase() === value.toUpperCase())?.value || null)
    );
  }
}
