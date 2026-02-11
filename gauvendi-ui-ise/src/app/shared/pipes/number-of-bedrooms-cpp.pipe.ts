import {Pipe, PipeTransform} from "@angular/core";
import {Reservation} from "@core/graphql/generated/graphql";

@Pipe({
  name: "numberOfBedroomsCpp",
  standalone: true,
})
export class NumberOfBedroomsCppPipe implements PipeTransform {
  transform(reservation: Reservation[]): number {
    return reservation?.reduce((acc, cur) => {
      return acc + cur?.rfc?.numberOfBedrooms;
    }, 0);
  }
}
