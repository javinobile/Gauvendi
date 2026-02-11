export type CartItem = {
  idx: number;
  adults?: number;
  children?: number[];
  pets?: number;
  arrival?: string;
  departure?: string;
  promoCode: string;
  selectedFeatures: string[];
  searchSnapshot?: object;
};
