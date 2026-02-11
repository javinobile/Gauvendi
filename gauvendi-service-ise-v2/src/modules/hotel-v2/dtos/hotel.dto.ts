import { IsString } from 'class-validator';
import { Translation } from 'src/core/database/entities/base.entity';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from 'src/core/dtos/common.dto';

export class HotelFilterDto extends Filter {
  @IsString()
  hotelCode: string;  
  
  @OptionalArrayProperty()
  expand?: string[];
}

export interface CountryResponseDto {
  code: string;
  name: string;
  phoneCode: string;
  translationList: Translation[];
}

export interface BrandResponseDto {
  name: string;
}

export class HotelConfigurationResponseDto {
  configType: string;
  configValue: {
    minChildrenAge?: number;
    maxChildrenAge?: number;
    maxChildrenCapacity?: number;
    colorCode?: string;
    shortDescription?: string;
    content?: string;
    title?: string;
    value?: string;
    metadata?: any;
  };
}

export interface BaseCurrencyResponseDto {
  code: string;
  currencyRateList: CurrencyRateResponseDto[];
}

export interface CurrencyRateResponseDto {
  rate: number;
  exchangeCurrency: ExchangeCurrencyResponseDto;
}

export interface ExchangeCurrencyResponseDto {
  code: string;
}

export interface HotelResponseDto {
  id: string;
  name: string;
  code: string;
  timeZone: string;
  iconImageUrl: string;
  iconSymbolUrl: string;
  state: string;
  city: string;
  address: string;
  phoneCode: string;
  phoneNumber: string;
  emailAddressList: string[];
  postalCode: string;
  signature: string;
  backgroundCategoryImageUrl: string;
  customThemeImageUrl: string;
  lowestPriceImageUrl: string;
  measureMetric: string;
  addressDisplay: string;
  isCityTaxIncludedSellingPrice: boolean;
  brand: BrandResponseDto;
  country: CountryResponseDto;
  taxSetting: string;
  serviceChargeSetting: string;
  hotelPaymentModeList: any[];
  hotelConfigurationList: HotelConfigurationResponseDto[];
  paymentAccount: null;
  baseCurrency: BaseCurrencyResponseDto;
  stayOptionBackgroundImageUrl: string;
  customizeStayOptionBackgroundImageUrl: string;
  stayOptionSuggestionImageUrl: string;
  signatureBackgroundImageUrl: string;
}
