import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { UpdateTaxSettingsItemPricingInputDto } from './update-tax-settings-item-pricing-input.dto';

export class UpdateTaxSettingsPricingInputDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Property Code (Hotel Code)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  hotelCode: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTaxSettingsItemPricingInputDto)
  @ApiPropertyOptional({
    description: 'List of tax settings items to update',
    type: [UpdateTaxSettingsItemPricingInputDto],
    example: [
      {
        serviceCode: 'ACCOMMODATION_001',
        serviceType: 'ACCOMMODATION',
        taxCodeList: ['CITY_TAX', 'TOURIST_TAX']
      },
      {
        serviceCode: 'EXTRAS_001',
        serviceType: 'EXTRAS',
        taxCodeList: ['VAT', 'SERVICE_TAX']
      }
    ]
  })
  itemList?: UpdateTaxSettingsItemPricingInputDto[];
}
