import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { LanguageCodeEnum } from 'src/core/database/entities/base.entity';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from 'src/core/dtos/common.dto';

export class HotelPaymentTermFilterDto extends Filter {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  idList?: string[];

  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  codeList?: string[];

  @IsOptional()
  @IsNumber()
  payAtHotel?: number;

  @IsOptional()
  @IsNumber()
  payOnConfirmation?: number;

  @IsOptional()
  @IsString({ each: true })
  @IsEnum(LanguageCodeEnum)
  @OptionalArrayProperty()
  languageCodeList?: string[];
}
