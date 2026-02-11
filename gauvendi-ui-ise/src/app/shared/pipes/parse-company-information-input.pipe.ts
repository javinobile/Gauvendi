import {Pipe, PipeTransform} from '@angular/core';
import {Guest} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'parseCompanyInformationInput',
  standalone: true
})
export class ParseCompanyInformationInputPipe implements PipeTransform {

  transform(value, ...args: unknown[]): Guest {
    if (value) {
      const {taxId, companyName, companyEmail, address, city, country, postalCode} = value;
      return {
        companyTaxId: taxId,
        companyName,
        companyEmail,
        companyAddress: address,
        companyCountry: country,
        companyCity: city,
        companyPostalCode: postalCode
      };
    }

    return {
      companyTaxId: null,
      companyName: null,
      companyEmail: null,
      companyAddress: null,
      companyCountry: null,
      companyCity: null,
      companyPostalCode: null
    };
  }

}
