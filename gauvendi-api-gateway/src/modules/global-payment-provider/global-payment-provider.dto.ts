import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { Filter } from "@src/core/dtos/common.dto";
import { IsUUID } from "class-validator";

export class GlobalPaymentProviderListDto extends Filter {
  @IsUUID()
  hotelId: string;

  @OptionalArrayProperty()
  codes?: string[];
}
