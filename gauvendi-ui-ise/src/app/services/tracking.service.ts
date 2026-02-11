import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ACTION_BEHAVIOUR, TrackingBehaviourService } from '@app/services/tracking-behaviour.service';
import { RouteKeyQueryParams } from '@constants/RouteKey';

import { HotelConfigService } from './hotel-config.service';

@Injectable({ providedIn: 'root' })
export class TrackingService {
  constructor(
    private hotelConfigService: HotelConfigService,
    private route: ActivatedRoute,
    private trackingBehaviourService: TrackingBehaviourService
  ) {}

  track(event: string, params?: object, action = ACTION_BEHAVIOUR.CLICK): void {
    this.trackingBehaviourService
      .trackingBehaviour(
        {
          event,
          params,
          ...this.getTrackingObj(),
        },
        action
      )
      .subscribe();
  }

  track3DSAdyen(event: string, params?: object, baseObjectTracking?: object, action = ACTION_BEHAVIOUR.CLICK): void {
    this.trackingBehaviourService
      .trackingBehaviour(
        {
          event,
          params,
          ...baseObjectTracking,
        },
        action
      )
      .subscribe();
  }

  getTrackingObj(): object {
    const queryParams = this.route.snapshot.queryParams;
    const checkIn = queryParams[RouteKeyQueryParams.checkInDate];
    const checkOut = queryParams[RouteKeyQueryParams.checkOutDate];
    const currency = queryParams[RouteKeyQueryParams.currency];
    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];
    const lang = queryParams[RouteKeyQueryParams.lang];
    const promoCode = queryParams[RouteKeyQueryParams.promoCode];
    const rooms = queryParams[RouteKeyQueryParams.numberOfRoom];
    const bookingFlow = queryParams[RouteKeyQueryParams.bookingFlow];
    const bookingSrc = queryParams[RouteKeyQueryParams.bookingSrc];
    return {
      hotel_code: hotelCode,
      lang: lang?.toLocaleUpperCase(),
      currency: currency?.toLocaleUpperCase(),
      checkin_date: checkIn ? formatDate(checkIn?.split('-')?.reverse()?.join('-'), 'MMM dd, yyyy', 'en-US') : null,
      checkout_date: checkOut ? formatDate(checkOut?.split('-')?.reverse()?.join('-'), 'MMM dd, yyyy', 'en-US') : null,
      rooms: rooms?.split(',')?.length || null,
      adults: rooms?.split(',')?.reduce((acc, val) => acc + +val?.split('-')[0], 0),
      children: rooms?.split(',')?.reduce((acc, val) => acc + +val?.split('-')?.length - 1, 0),
      promo_code: promoCode || null,
      base_currency: this.hotelConfigService?.baseCurrency?.value,
      booking_flow: bookingFlow || null,
      booking_src: bookingSrc || 'Website',
    };
  }
}
