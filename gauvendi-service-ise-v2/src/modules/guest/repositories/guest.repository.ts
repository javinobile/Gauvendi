import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Guest } from 'src/core/entities/booking-entities/guest.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { GuestDto } from 'src/modules/booking/dtos/request-booking.dto';
import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GuestRepository extends BaseService {
  private readonly logger = new Logger(GuestRepository.name);

  constructor(
    @InjectRepository(Guest, DB_NAME.POSTGRES)
    private readonly guestRepository: Repository<Guest>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async getGuestsByIds(ids: string[]): Promise<Guest[] | null> {
    try {
      const guest = await this.guestRepository.find({ where: { id: In(ids) } });
      return guest;
    } catch (error) {
      const err = error?.response?.data;
      throw new BadRequestException(err);
    }
  }

  async getGuestById(id: string): Promise<Guest | null> {
    try {
      const guest = await this.guestRepository.findOne({ where: { id } });
      return guest;
    } catch (error) {
      const err = error?.response?.data;
      throw new BadRequestException(err);
    }
  }

  async createGuest(data: GuestDto, hotelId: string, isBooker: boolean = false): Promise<Guest> {
    const {
      firstName,
      lastName,
      emailAddress,
      countryId,
      address,
      city,
      state,
      postalCode,
      phoneInfo,
      preferredLanguage
    } = data;
    if (data.id && isBooker) {
      const updateGuest: Partial<Guest> = {
        id: data.id,
        firstName,
        lastName,
        countryId,
        address,
        city,
        state,
        postalCode,
        countryNumber: phoneInfo?.phoneCode || null,
        phoneNumber: phoneInfo?.phoneNumber || null,
        companyEmail: data.companyEmail || null,
        companyAddress: data.companyAddress || null,
        companyCity: data.companyCity || null,
        companyCountry: data.companyCountry || null,
        companyName: data.companyName || null,
        companyPostalCode: data.companyPostalCode || null,
        companyTaxId: data.companyTaxId || null,
        updatedBy: this.currentSystem,
        updatedAt: new Date(),
        preferredLanguage
      };
      await this.guestRepository.upsert(updateGuest, ['id']);
      return (await this.getGuestById(data.id)) as Guest;
    }
    const guest = this.guestRepository.create({
      id: data.id || uuidv4(),
      firstName,
      lastName,
      emailAddress,
      countryId,
      address,
      city,
      state,
      postalCode,
      countryNumber: phoneInfo?.phoneCode,
      phoneNumber: phoneInfo?.phoneNumber,
      isBooker,
      isMainGuest: !isBooker, // Set isMainGuest opposite of isBooker
      isReturningGuest: false, // Default to false for new guests
      companyEmail: data.companyEmail || null,
      companyAddress: data.companyAddress || null,
      companyCity: data.companyCity || null,
      companyCountry: data.companyCountry || null,
      companyName: data.companyName || null,
      companyPostalCode: data.companyPostalCode || null,
      companyTaxId: data.companyTaxId || null,
      hotelId: hotelId,
      createdBy: this.currentSystem,
      createdAt: new Date(),
      updatedBy: this.currentSystem,
      updatedAt: new Date(),
      preferredLanguage
    });

    try {
      return await this.guestRepository.save(guest);
    } catch (error) {
      const err = error?.response?.data;
      this.logger.error(err);
      throw new BadRequestException(err);
    }
  }

  async createAdditionalGuests(data: Partial<Guest>[]): Promise<Guest[]> {
    const guests = this.guestRepository.create(data);
    try {
      return await this.guestRepository.save(guests);
    } catch (error) {
      const err = error?.response?.data;
      this.logger.error(err);
      throw new BadRequestException(err);
    }
  }

  async createGuests(data: Partial<Guest>[]): Promise<Guest[]> {
    try {
      return await this.guestRepository.save(data);
    } catch (error) {
      const err = error?.response?.data;
      this.logger.error(err);
      throw new BadRequestException(err);
    }
  }

  async createAdditionalGuestsV2(data: GuestDto[], hotelId: string): Promise<Guest[]> {
    try {
      const guests = data.map((guest) => this.buildGuest(guest, hotelId));
      return await this.guestRepository.save(guests);
    } catch (error) {
      const err = error?.response?.data;
      this.logger.error(err);
      throw new BadRequestException(err);
    }
  }

  private buildGuest(data: GuestDto, hotelId: string): Partial<Guest> {
    try {
      const {
        firstName,
        lastName,
        emailAddress,
        countryId,
        address,
        city,
        state,
        postalCode,
        phoneInfo,
        isBooker,
        isMainGuest
      } = data;
      const guest = this.guestRepository.create({
        id: data.id || uuidv4(),
        firstName,
        lastName,
        emailAddress,
        countryId,
        address,
        city,
        state,
        postalCode,
        countryNumber: phoneInfo?.phoneCode,
        phoneNumber: phoneInfo?.phoneNumber,
        isBooker,
        isMainGuest,
        isReturningGuest: false, // Default to false for new guests
        companyEmail: data.companyEmail || null,
        companyAddress: data.companyAddress || null,
        companyCity: data.companyCity || null,
        companyCountry: data.companyCountry || null,
        companyName: data.companyName || null,
        companyPostalCode: data.companyPostalCode || null,
        companyTaxId: data.companyTaxId || null,
        hotelId: hotelId,
        createdBy: this.currentSystem,
        createdAt: new Date(),
        updatedBy: this.currentSystem,
        updatedAt: new Date()
      });
      return guest;
    } catch (error) {
      const err = error?.response?.data;
      this.logger.error(err);
      throw new BadRequestException(err);
    }
  }
}
