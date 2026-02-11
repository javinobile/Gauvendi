import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class PropertyTaxTranslationDto {
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
    description: 'Property tax ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  propertyTaxId?: string;

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
    example: 'City Tax'
  })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Translated description',
    example: 'City tax applied per person per night'
  })
  description?: string;
}
