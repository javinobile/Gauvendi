export class GetHotelEventsDto {
  hotelId: string;

  isVisible: boolean;

  startDate?: string;

  endDate?: string;

  idList?: string[];

  expand: string[];
}

export abstract class EventFeatureInputDto {
  eventId?: string;

  id?: string;

  propertyRetailFeatureId?: string;
}

export abstract class MigrateHotelEventsTranslationDto {  
  languageCode: string;
  name: string;
}

export abstract class UpsertHotelEventDto {
  id?: string;

  categoryId: string;

  hotelId: string;

  name?: string;

  note?: string;

  labels?: string[];

  location?: string;

  isVisible?: boolean;

  startDate?: string;

  endDate?: string;

  eventFeatureInputList?: EventFeatureInputDto[];

  translations?: MigrateHotelEventsTranslationDto[];
}
