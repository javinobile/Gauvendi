import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {debounceTime, map, switchMap} from 'rxjs/operators';
import {loadedStaticContentSuccessfully, loadStaticContent} from "@store/multi-lang/multi-lang.actions";
import {MultiLangApiService} from "@app/apis/multi-lang-api.service";
import {StaticLanguageContent} from '@store/multi-lang/multi-lang.state';

@Injectable()
export class MultiLangEffects {
  constructor(
    private actions$: Actions,
    private multiLangService: MultiLangApiService
  ) {
  }

  loadStaticContent$ = createEffect(() => this.actions$.pipe(
    ofType(loadStaticContent),
    debounceTime(200),
    switchMap(({locale}) => this.multiLangService.staticLanguageContent(locale).pipe(
        map(res => loadedStaticContentSuccessfully({contents: res as StaticLanguageContent[]})),
      )
    )
  ));
}
