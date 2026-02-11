import { Guest } from '@core/graphql/generated/graphql';

export interface ReservationGuests {
  index: number;
  guestList: Guest[];
  productInfo: {
    name: string;
  };
}
