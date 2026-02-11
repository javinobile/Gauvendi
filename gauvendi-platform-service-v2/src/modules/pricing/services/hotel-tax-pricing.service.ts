import { Injectable } from '@nestjs/common';
import { PropertyTaxFilterDto, UpdateTaxSettingsInputDto } from 'src/modules/hotel-tax/dto';
import { HotelTaxRepository } from 'src/modules/hotel-tax/repositories/hotel-tax.repository';

@Injectable()
export class HotelTaxPricingService {
  constructor(private readonly hotelTaxRepository: HotelTaxRepository) {}

  async hotelTaxList(filter: PropertyTaxFilterDto) {
    return this.hotelTaxRepository.getHotelTaxes(filter);
  }

  async updateHotelTaxSettings(dto: UpdateTaxSettingsInputDto) {
    return this.hotelTaxRepository.updateHotelTaxSettings(dto);
  }
}
