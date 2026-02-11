export interface HotelTaxDtoLike {
  code?: string;
  rate?: number; // e.g. 0.1 for 10% in Java; here we treat as percent (10)
  validFrom?: Date;
  validTo?: Date;
}

export interface HotelTaxSettingDtoLike {
  taxCode: string;
  hotelTax: HotelTaxDtoLike;
}

export interface HotelTaxCompositeModelLike {
  serviceChargeRate?: number; // percent
  serviceChargeTaxRate?: number; // percent
  hotelTaxSettingListMap: Record<string, HotelTaxSettingDtoLike[]>;
}
