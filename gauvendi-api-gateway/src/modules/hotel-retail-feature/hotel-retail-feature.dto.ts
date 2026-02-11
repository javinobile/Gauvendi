import { Filter } from "@src/core/dtos/common.dto";
import { IsOptional, IsUUID } from "class-validator";

export class HotelRetailFeaturesInputDto extends Filter {
  @IsOptional()
  @IsUUID()
  hotelId?: string;
}
