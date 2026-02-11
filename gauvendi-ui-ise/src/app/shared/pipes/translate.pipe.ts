import { Pipe, PipeTransform } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { map, skipWhile } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { SectionCodeEnum } from '@store/multi-lang/multi-lang.state';
import { selectorSectionContent } from '@store/multi-lang/multi-lang.selectors';

@Pipe({
  name: 'translate',
  standalone: true
})
export class TranslatePipe implements PipeTransform {
  constructor(private store: Store) {}

  transform(labelCode: string): Observable<string> {
    return this.store.pipe(
      select(selectorSectionContent(SectionCodeEnum.ISE)),
      skipWhile((data) => !data),
      map(
        (data) =>
          data?.find((item) => item?.key === labelCode)?.value || labelCode
      )
    );
  }
}
