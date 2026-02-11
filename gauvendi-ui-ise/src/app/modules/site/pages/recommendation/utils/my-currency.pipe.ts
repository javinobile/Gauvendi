import { CurrencyPipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LocaleMapSymbolCurrency } from '@app/store/multi-lang/multi-lang.state';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'myCurrency',
  standalone: true,
  pure: false // required for change detection to re-run on updates
})
export class MyCurrencyPipe extends CurrencyPipe implements PipeTransform {
  route = inject(ActivatedRoute); 
  private locale: string = 'en-IE';
  private sub: Subscription;

  constructor() {
    super('en-IE'); // default
    this.sub = this.route.queryParams.subscribe((params) => {
      this.locale = LocaleMapSymbolCurrency[params['lang']];
      
    });
  }
  // @ts-ignore
  transform(
    value: any,
    currencyCode?: string,
    display?: 'code' | 'symbol' | 'symbol-narrow' | string | boolean,
    digitsInfo?: string,
    locale?: string
  ): string | null {
    const currencyFormat = super.transform(
      value,
      currencyCode,
      display,
      digitsInfo,
      this.locale
    );
    
    const firstDigit = currencyFormat?.search(/\d/);
    
    if (currencyFormat && firstDigit !== -1) {
      return (
        currencyFormat.substring(0, firstDigit) +
        ' ' +
        currencyFormat.substr(firstDigit)
      );
    }
    
    return currencyFormat;
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
