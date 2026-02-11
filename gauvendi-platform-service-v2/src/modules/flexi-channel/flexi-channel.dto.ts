export class FlexiChannelFilter {
  hotelId: string;
}
export class CreateFlexiChannel {
  hotelId: string;
  mappings: FlexiChannelMapping[];
}

export class UpdateFlexiChannel {
  hotelId: string;
  mappings: FlexiChannelMappingUpdate[];
}

export class FlexiChannelMapping {
  mappingHotelCode: string;
  name: string;
}

export class FlexiChannelMappingUpdate {
  mappingHotelCode: string;
  name: string;
  id: string;
}

export class UpdateFlexiRoomMappings {
  hotelId: string;
  mappings: UpdateFlexiRoomMapping[];
}

export class UpdateFlexiRoomMapping {
  name: string;
  id: string;

  roomProductList: {
    id: string;
    mappingCode: string;
  }[];
}

export class UpdateFlexiRatePlanMappings {
  hotelId: string;
  mappings: UpdateFlexiRatePlanMapping[];
}

export class UpdateFlexiRatePlanMapping {
  id: string;

  salesPlanList: {
    id: string;
    mappingCode: string;
    extraServiceIncluded: boolean;
  }[];
}
