import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { PriorityCategoryCodeDto, StayOptionsDto } from "@src/modules/ise-recommendation/ise-recommendation.dto";
import { IsDateString, IsNotEmpty, IsString } from "class-validator";

export class ExcludedListDto {
  @IsString()
  @IsNotEmpty()
  arrival: string;
  @IsString()
  @IsNotEmpty()
  departure: string;
  @IsString()
  @IsNotEmpty()
  roomId: string;
}

export class IseRecommendedOffersDto extends StayOptionsDto {
  @OptionalArrayProperty()
  excludedList: ExcludedListDto[];

  @OptionalArrayProperty()
  preferredFeatureList: any
}
