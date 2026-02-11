import { Filter } from "@src/core/dtos/common.dto";

export class GetListUserQueryDto extends Filter {
  organisation_id: string;
  hotelId?: string;
  ids?: string[];
}