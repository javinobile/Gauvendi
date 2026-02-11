import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { Filter } from 'src/core/dtos/common.dto';

export class HotelRatePlanFilterDto extends Filter {
  @IsOptional()
  @IsString()
  hotelCode?: string;

  @IsOptional()
  @IsString()
  code?: string; // Rate plan code

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value?.trim() === 'null' || value?.trim() === 'undefined') ? undefined : value?.trim())
  roomProductCode?: string;

  @IsOptional()
  @IsDateString()
  arrival?: string;

  @IsOptional()
  @IsDateString()
  departure?: string;

  @IsOptional()
  @IsString()
  promoCode?: string;
}
