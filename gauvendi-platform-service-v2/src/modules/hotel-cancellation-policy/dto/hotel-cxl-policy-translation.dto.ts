import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class HotelCxlPolicyTranslationDto {
  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Translation ID',
    example: 'c3d4e5f6-g7h8-9012-cdef-g34567890123'
  })
  id?: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Hotel ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012'
  })
  hotelId?: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Hotel cancellation policy ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  hotelCxlPolicyId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Language code',
    example: 'en',
    maxLength: 10
  })
  languageCode?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Translated name',
    example: 'Standard Cancellation Policy'
  })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Translated description',
    example: 'Free cancellation up to 24 hours before check-in. After that, a fee of 50% of the first night will be charged.'
  })
  description?: string;
}
