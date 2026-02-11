import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Connector } from 'src/core/entities/hotel-entities/connector.entity';
import { GlobalPaymentMethod } from 'src/core/entities/hotel-entities/global-payment-method.entity';
import { GlobalPaymentProvider } from 'src/core/entities/hotel-entities/global-payment-provider.entity';
import { HotelAmenityPrice } from 'src/core/entities/hotel-entities/hotel-amenity-price.entity';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelCityTax } from 'src/core/entities/hotel-entities/hotel-city-tax.entity';
import { HotelConfiguration } from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelPaymentMethodSetting } from 'src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { MappingPmsHotel } from 'src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { ConnectorRepository } from './repositories/connector.repository';
import { GlobalPaymentMethodRepository } from './repositories/global-payment-method.repository';
import { GlobalPaymentProviderRepository } from './repositories/global-payment-provider.repository';
import { HotelAmenityPriceRepository } from './repositories/hotel-amenity-price.repository';
import { HotelAmenityRepository } from './repositories/hotel-amenity.repository';
import { HotelCityTaxRepository } from './repositories/hotel-city-tax.repository';
import { HotelConfigurationRepository } from './repositories/hotel-configuration.repository';
import { HotelTaxRepository } from './repositories/hotel-tax.repository';
import { HotelRepository } from './repositories/hotel.repository';
import { MappingHotelRepository } from './repositories/mapping-hotel.repository';
import { HotelPaymentMethodSettingRepository } from './repositories/property-payment-method-setting.repository';

@Module({
  controllers: [],
  imports: [
    TypeOrmModule.forFeature(
      [
        Hotel,
        Connector,
        MappingPmsHotel,
        HotelConfiguration,
        HotelAmenity,
        HotelCityTax,
        HotelAmenityPrice,
        GlobalPaymentProvider,
        GlobalPaymentMethod,
        HotelPaymentMethodSetting,
        HotelTaxSetting,
        HotelTax
      ],
      DB_NAME.POSTGRES
    )
  ],
  exports: [
    TypeOrmModule,
    HotelRepository,
    ConnectorRepository,
    MappingHotelRepository,
    HotelConfigurationRepository,
    HotelAmenityRepository,
    HotelCityTaxRepository,
    HotelAmenityPriceRepository,
    HotelPaymentMethodSettingRepository,
    GlobalPaymentProviderRepository,
    GlobalPaymentMethodRepository,
    HotelTaxRepository,
  ],
  providers: [
    HotelRepository,
    ConnectorRepository,
    MappingHotelRepository,
    HotelConfigurationRepository,
    HotelAmenityRepository,
    HotelCityTaxRepository,
    HotelAmenityPriceRepository,
    HotelPaymentMethodSettingRepository,
    GlobalPaymentProviderRepository,
    GlobalPaymentMethodRepository,
    HotelTaxRepository,
  ]
})
export class HotelModule {}
