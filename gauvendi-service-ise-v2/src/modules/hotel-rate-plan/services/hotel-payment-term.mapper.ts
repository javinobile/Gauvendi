import { Injectable } from '@nestjs/common';
import { HotelPaymentTerm } from 'src/core/entities/hotel-entities/hotel-payment-term.entity';
import { HotelPaymentTermDto } from '../dtos/rate-plan-payment-term-setting.dto';

@Injectable()
export class HotelPaymentTermMapper {
  toDto(entity: HotelPaymentTerm): HotelPaymentTermDto {
    return {
      id: entity.id,
      hotelId: entity.hotelId,
      name: entity.name,
      code: entity.code,
      description: entity.description,
      payAtHotel: entity.payAtHotel,
      payOnConfirmation: entity.payOnConfirmation,
      payAtHotelDescription: entity.payAtHotelDescription,
      payOnConfirmationDescription: entity.payOnConfirmationDescription,
      translationList: entity.translations
    };
  }
}
