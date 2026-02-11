import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import {
  HotelPaymentAccount,
  PaymentAccountTypeEnum
} from 'src/core/entities/hotel-entities/hotel-payment-account.entity';
import { Repository } from 'typeorm';
import { HotelPaymentAccountDto } from '../dtos/hotel-payment-account.dto';

@Injectable()
export class HotelPaymentAccountRepository {
  private readonly logger = new Logger(HotelPaymentAccountRepository.name);

  constructor(
    @InjectRepository(HotelPaymentAccount, DB_NAME.POSTGRES)
    private readonly hotelPaymentAccountRepository: Repository<HotelPaymentAccount>
  ) {}

  async getHotelPaymentAccount(body: HotelPaymentAccountDto): Promise<HotelPaymentAccount | null> {
    try {
      const hotelPaymentAccount = await this.hotelPaymentAccountRepository.findOne({
        where: {
          hotelId: body.hotelId,
          ...(body.type && { type: body.type as PaymentAccountTypeEnum })
        }
      });

      return hotelPaymentAccount;
    } catch (error) {
      this.logger.error(`Error getting hotel payment account: ${error.message}`);
      throw error;
    }
  }

  async getHotelPaymentAccountByType(
    hotelId: string,
    type: PaymentAccountTypeEnum
  ): Promise<HotelPaymentAccount | null> {
    try {
      const hotelPaymentAccount = await this.hotelPaymentAccountRepository.findOne({
        where: {
          hotelId,
          type
        }
      });

      return hotelPaymentAccount;
    } catch (error) {
      this.logger.error(`Error getting hotel payment account by type: ${error.message}`);
      throw error;
    }
  }
}

