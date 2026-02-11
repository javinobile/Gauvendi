import {Pipe, PipeTransform} from '@angular/core';
import {GuestInformationInput} from "@core/graphql/generated/graphql";
import { BookerForSomeoneModel } from "@models/booker-for-someone.model";

@Pipe({
  name: 'parseGuestInformationInput',
  standalone: true
})
export class ParseGuestInformationInputPipe implements PipeTransform {

  transform(value, ...args: unknown[]): BookerForSomeoneModel {
    if (value) {
      const {firstName, lastName, email, country, postalCode, city, state, phoneNumber, address, bookForAnother} = value;
      return {
        firstName,
        lastName,
        emailAddress: email,
        countryId: country,
        city,
        state,
        postalCode,
        phoneInfo: phoneNumber?.phoneNumber && phoneNumber || null,
        address,
        bookForAnother
      };
    }

    return {
      firstName: null,
      lastName: null,
      emailAddress: null,
      countryId: null,
      city: null,
      postalCode: null,
      phoneInfo: null,
      address: null,
      bookForAnother: false
    };
  }

}
