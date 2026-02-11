import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'convertSuggestedFeatureText',
  standalone: true
})
export class ConvertSuggestedFeatureTextPipe implements PipeTransform
{

  transform(total: { adult: number, children: number }): string {
    if (total?.adult > 0 && total?.children === 0)
    {
      if (+total?.adult >= 8)
      {
        return 'TRAVELLING_AS_GROUP';
      }
      switch (+total?.adult)
      {
        case 1:
          return 'SOLO_TRAVELLER';
        case 2:
          return 'TWO_TRAVELLERS';
        case 3:
          return 'THREE_TRAVELLERS';
        case 4:
        case 5:
        case 6:
        case 7:
          return 'SMALL_GROUPS';
      }
    }

    // have child or children
    if (total?.adult > 0 && total?.children > 0)
    {
      if (+total?.children === 1)
      {
        return 'TRAVELLING_WITH_KIDS';
      }
      else
      {
        return 'FAMILY_TRIP';
      }
    }
    return '';
  }

}
