import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'mappingPaymentTypeIcon',
  standalone: true
})
export class MappingPaymentTypeIconPipe implements PipeTransform {
  transform(value: string) {
    if (!value) return 'assets/payment/credit-card.svg';
    const mappingCodes = {
      Mastercard: 'assets/payment/master-card.svg',
      visa: 'assets/payment/visa-card.svg',
      mc: 'assets/payment/master-card.svg',
      'Master Card': 'assets/payment/master-card.svg',
      'AMERICAN EXPRESS': 'assets/payment/american-express-card.svg',
      amex: 'assets/payment/amex-card.svg',
      visadankort: 'assets/payment/visa-card.svg',
      AE: 'assets/payment/american-express-card.svg',
      VC: 'assets/payment/visa-card.svg',
      Discover: 'assets/payment/visa-card.svg',
      diners: 'assets/payment/visa-card.svg',
      JC: 'assets/payment/visa-card.svg',
      cup: 'assets/payment/visa-card.svg'
    };

    return mappingCodes[value] || 'assets/payment/credit-card.svg';
  }
}
