import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReservationHandlerService
{

  addAdults(adultCount: number, additionalGuestList: any[]): any[] {
    const additionalGuest = [];
    for (let i = 0; i < adultCount; i++)
    {
      const additionalAdultIndex = additionalGuestList.findIndex(item => item?.isAdult);
      if (additionalAdultIndex !== -1)
      {
        additionalGuest.push({
          firstName: additionalGuestList[additionalAdultIndex]?.firstName,
          lastName: additionalGuestList[additionalAdultIndex]?.lastName,
          isAdult: true
        });
      }

      additionalGuestList?.splice(additionalAdultIndex, 1);
    }

    return additionalGuest;
  }

  addChildren(childrenCount: number, additionalGuestList: any[]): any[] {
    const additionalGuest = [];
    for (let i = 0; i < childrenCount; i++)
    {
      const additionalChildrenIndex = additionalGuestList.findIndex(item => !item?.isAdult);
      if (additionalChildrenIndex !== -1)
      {
        additionalGuest.push({
          firstName: additionalGuestList[additionalChildrenIndex]?.firstName,
          lastName: additionalGuestList[additionalChildrenIndex]?.lastName,
          isAdult: false
        });
      }

      additionalGuestList?.splice(additionalChildrenIndex, 1);
    }

    return additionalGuest;
  }
}
