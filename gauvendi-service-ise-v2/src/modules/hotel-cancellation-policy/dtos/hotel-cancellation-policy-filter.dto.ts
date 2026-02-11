import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Filter } from '../../../core/dtos/common.dto';

export class HotelCancellationPolicyFilterDto extends Filter {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  idList?: string[];

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}


export class HotelCancellationPoliciesFilterDto extends Filter {
  hotelId: string;
  codes: string[];
}
