import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { Filter } from "@src/core/dtos/common.dto";
import { IsOptional, IsUUID } from "class-validator";

export class GetListUserQueryDto extends Filter {
    @IsUUID()
    @IsOptional()
    hotelId?: string;

    @OptionalArrayProperty()
    ids?: string[]
}
