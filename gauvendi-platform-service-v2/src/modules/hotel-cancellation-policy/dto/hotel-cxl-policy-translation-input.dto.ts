import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class HotelCxlPolicyTranslationInputDto {
  @ApiPropertyOptional({
    description: 'Translation ID',
    example: 'c3d4e5f6-g7h8-9012-cdef-g34567890123'
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({
    description: 'Hotel ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012'
  })
  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @ApiPropertyOptional({
    description: 'Hotel cancellation policy ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  @IsOptional()
  @IsUUID()
  hotelCxlPolicyId?: string;

  @ApiPropertyOptional({
    description: 'Language code',
    example: 'en',
    maxLength: 10
  })
  @IsOptional()
  @IsString()
  languageCode?: string;

  @ApiPropertyOptional({
    description: 'Translated name',
    example: 'Standard Cancellation Policy'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Translated description',
    example: 'Free cancellation up to 24 hours before check-in. After that, a fee of 50% of the first night will be charged.'
  })
  @IsOptional()
  @IsString()
  description?: string;
}
