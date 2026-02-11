import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import { Cache } from 'cache-manager';
import * as _ from 'lodash';
import { DB_NAME } from 'src/core/constants/db.const';
import { Guest } from 'src/core/entities/booking-entities/guest.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { GuestDto } from 'src/modules/guest/dtos/guest.dto';
import { FindOptionsSelect, FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GuestRepository extends BaseService {
  private readonly logger = new Logger(GuestRepository.name);
  private readonly PROPERTY_GUEST_ID_CACHE_KEY = 'guest::property::%s';
  private readonly CACHE_TTL_DAYS = 365;

  constructor(
    @InjectRepository(Guest, DB_NAME.POSTGRES)
    private readonly guestRepository: Repository<Guest>,
    @InjectRepository(Booking, DB_NAME.POSTGRES)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Reservation, DB_NAME.POSTGRES)
    private readonly reservationRepository: Repository<Reservation>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    configService: ConfigService
  ) {
    super(configService);
    // this.adminSyncGuests();
  }

  async adminSyncGuests(): Promise<any> {
    await this.adminSyncGuestsByBooking();
    await this.adminSyncGuestsByReservation();
    return true;
  }

  async adminSyncGuestsByBooking(): Promise<void> {
    try {
      const bookings = await this.bookingRepository.find({
        where: { hotelId: Not(IsNull()) },
        select: { hotelId: true, bookerId: true }
      });
      console.log('Total bookings: ', bookings?.length);
      const guestMapping = new Map<string, string[]>();
      for (const booking of bookings) {
        if (!booking.bookerId || !booking.hotelId) {
          continue;
        }
        const arr = guestMapping.get(booking.bookerId) || [];
        arr.push(booking.hotelId);
        guestMapping.set(booking.bookerId, arr);
      }
      const guestIds = Array.from(guestMapping.keys());
      const guests = await this.guestRepository.find({ where: { id: In(guestIds) } });
      let filteredGuests: any[] = guests?.filter(
        (guest) => guestMapping.has(guest.id) && !guest.hotelId
      );
      for (const guest of filteredGuests) {
        if (guestMapping.get(guest.id)?.length !== 1) {
          console.log(
            `Guest ${guest.firstName} ${guest.lastName} has multiple hotel IDs: ${guestMapping.get(guest.id)?.join(',')}`
          );
          continue;
        }
        guest.hotelId = guestMapping.get(guest.id)?.[0] || null;
      }
      filteredGuests = filteredGuests.map((guest) => ({
        id: guest.id,
        hotelId: guest.hotelId
      }));
      // save batch here
      const splitGuests = _.chunk(filteredGuests, 500);
      if (!splitGuests?.length) {
        console.log('No guests to save');
        return;
      }
      for (const chunk of splitGuests) {
        console.log(`Saving chunk of ${chunk.length} guests`);
        await this.guestRepository.upsert(chunk, {
          conflictPaths: ['id'],
          skipUpdateIfNoValuesChanged: true
        });
        console.log(`SUCCESS: Saved chunk of ${chunk.length} guests`);
      }
    } catch (error) {
      const err = error?.response?.data;
      this.logger.error(err);
    }
  }

  async adminSyncGuestsByReservation(): Promise<void> {
    try {
      const reservations = await this.reservationRepository.find({
        where: { hotelId: Not(IsNull()), primaryGuestId: Not(IsNull()) },
        select: { hotelId: true, primaryGuestId: true }
      });
      console.log('Total reservations: ', reservations?.length);
      const guestMapping = new Map<string, string[]>();
      for (const reservation of reservations) {
        if (!reservation.primaryGuestId || !reservation.hotelId) {
          continue;
        }
        const arr = guestMapping.get(reservation.primaryGuestId) || [];
        arr.push(reservation.hotelId);
        guestMapping.set(reservation.primaryGuestId, arr);
      }
      const guestIds = Array.from(guestMapping.keys());
      const guests = await this.guestRepository.find({ where: { id: In(guestIds) } });
      let filteredGuests: any[] = guests?.filter(
        (guest) => guestMapping.has(guest.id) && !guest.hotelId
      );
      for (const guest of filteredGuests) {
        if (guestMapping.get(guest.id)?.length !== 1) {
          console.log(
            `Guest ${guest.firstName} ${guest.lastName} has multiple hotel IDs: ${guestMapping.get(guest.id)?.join(',')}`
          );
          continue;
        }
        guest.hotelId = guestMapping.get(guest.id)?.[0] || null;
      }
      filteredGuests = filteredGuests.map((guest) => ({
        id: guest.id,
        hotelId: guest.hotelId
      }));
      // save batch here
      const splitGuests = _.chunk(filteredGuests, 500);
      if (!splitGuests?.length) {
        console.log('No guests to save');
        return;
      }
      for (const chunk of splitGuests) {
        console.log(`Saving chunk of ${chunk.length} guests`);
        await this.guestRepository.upsert(chunk, {
          conflictPaths: ['id'],
          skipUpdateIfNoValuesChanged: true
        });
        console.log(`SUCCESS: Saved chunk of ${chunk.length} guests`);
      }
    } catch (error) {
      const err = error?.response?.data;
      this.logger.error(err);
    }
  }

  // async adminSyncAdditionalGuestsByReservation(): Promise<void> {
  //   try {
  //     const reservations = await this.reservationRepository.find({
  //       where: { hotelId: Not(IsNull()), additionalGuests: Not(IsNull()) },
  //       select: { hotelId: true, additionalGuests: true }
  //     });
  //     console.log('Total reservations: ', reservations?.length);
  //     const guestMapping = new Map<string, string[]>();
  //     for (const reservation of reservations) {
  //       if (!reservation.primaryGuestId || !reservation.hotelId) {
  //         continue;
  //       }
  //       const arr = guestMapping.get(reservation.primaryGuestId) || [];
  //       arr.push(reservation.hotelId);
  //       guestMapping.set(reservation.primaryGuestId, arr);
  //     }
  //     const guestIds = Array.from(guestMapping.keys());
  //     const guests = await this.guestRepository.find({ where: { id: In(guestIds) } });
  //     const filteredGuests = guests?.filter(
  //       (guest) => guestMapping.has(guest.id) && !guest.hotelId
  //     );
  //     for (const guest of filteredGuests) {
  //       if (guestMapping.get(guest.id)?.length !== 1) {
  //         console.log(
  //           `Guest ${guest.firstName} ${guest.lastName} has multiple hotel IDs: ${guestMapping.get(guest.id)?.join(',')}`
  //         );
  //         continue;
  //       }
  //       guest.hotelId = guestMapping.get(guest.id)?.[0] || null;
  //     }
  //     // save batch here
  //     const splitGuests = _.chunk(filteredGuests, 500);
  //     if (!splitGuests?.length) {
  //       console.log('No guests to save');
  //       return;
  //     }
  //     for (const chunk of splitGuests) {
  //       console.log(`Saving chunk of ${chunk.length} guests`);
  //       await this.guestRepository.save(chunk);
  //       console.log(`SUCCESS: Saved chunk of ${chunk.length} guests`);
  //     }
  //   } catch (error) {
  //     const err = error?.response?.data;
  //     this.logger.error(err);
  //   }
  // }

  async getGuestsByIds(ids: string[]): Promise<Guest[] | null> {
    try {
      const guest = await this.guestRepository.find({ where: { id: In(ids) } });
      return guest;
    } catch (error) {
      const err = error?.response?.data;
      throw new BadRequestException(err);
    }
  }

  async findOne(
    filter: { id?: string; ids?: string[]; hotelId?: string },
    select?: FindOptionsSelect<Guest>
  ): Promise<Guest | null> {
    try {
      const { id, ids, hotelId } = filter;
      const where: FindOptionsWhere<Guest> = {};
      if (id) {
        where.id = id;
      }
      if (hotelId) {
        where.hotelId = hotelId;
      }
      if (ids && ids.length) {
        where.id = In(ids);
      }
      return await this.guestRepository.findOne({ where, select });
    } catch (error) {
      const err = error?.response?.data;
      throw new BadRequestException(err);
    }
  }

  async save(guest: Guest): Promise<Guest> {
    try {
      return await this.guestRepository.save(guest);
    } catch (error) {
      const err = error?.response?.data;
      throw new BadRequestException(err);
    }
  }

  async createGuest(
    data: GuestDto,
    hotelId: string,
    isBooker: boolean = false,
    isMainGuest: boolean = false
  ): Promise<Guest> {
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
      isBooker: isBooker,
      isMainGuest: isMainGuest,
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

  async getGuestById(id: string): Promise<Guest | null> {
    try {
      const guest = await this.guestRepository.findOne({ where: { id } });
      return guest;
    } catch (error) {
      const err = error?.response?.data;
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

  async upsertGuests(data: Partial<Guest>[]) {
    try {
      return await this.guestRepository.upsert(data, {
        conflictPaths: ['id'],
        skipUpdateIfNoValuesChanged: true
      });
    } catch (error) {
      const err = error?.response?.data;
      this.logger.error(err);
      throw new BadRequestException(err);
    }
  }

  async searchGuests(
    propertyId: string,
    query?: string,
    pageIndex: number = 0,
    pageSize: number = 10
  ): Promise<{ guests: Guest[]; count: number }> {
    try {
      console.log(query);

      const queryBuilder = this.guestRepository
        .createQueryBuilder('guest')
        .where('guest.hotelId = :propertyId', { propertyId });

      if (query && query.trim()) {
        const searchTerm = `%${query.trim()}%`;

        // Build OR conditions properly
        const orConditions: string[] = [
          'guest.firstName ILIKE :searchTerm',
          'guest.lastName ILIKE :searchTerm',
          'guest.emailAddress ILIKE :searchTerm'
        ];

        const parameters: any = { searchTerm };

        // If query contains multiple words, add firstName+lastName combination searches
        if (query.trim().includes(' ')) {
          const nameParts = query.trim().split(/\s+/);
          if (nameParts.length >= 2) {
            const firstName = `%${nameParts[0]}%`;
            const lastName = `%${nameParts.slice(1).join(' ')}%`;

            // Add combined search conditions (firstName AND lastName)
            orConditions.push(
              '(guest.firstName ILIKE :firstName AND guest.lastName ILIKE :lastName)'
            );
            parameters.firstName = firstName;
            parameters.lastName = lastName;

            // Also check reverse order
            orConditions.push(
              '(guest.firstName ILIKE :lastNameRev AND guest.lastName ILIKE :firstNameRev)'
            );
            parameters.firstNameRev = lastName;
            parameters.lastNameRev = firstName;
          }
        }

        // Combine all OR conditions into one WHERE clause
        queryBuilder.andWhere(`(${orConditions.join(' OR ')})`, parameters);
      }

      // Get paginated results with distinct by name + email combination
      const guests = await queryBuilder
        .distinctOn(['guest.firstName', 'guest.lastName', 'guest.emailAddress'])
        .orderBy('guest.firstName', 'ASC')
        .addOrderBy('guest.lastName', 'ASC')
        .addOrderBy('guest.emailAddress', 'ASC')
        .addOrderBy('guest.createdAt', 'DESC')
        .addOrderBy('guest.id', 'DESC')
        .skip(pageIndex * pageSize)
        .take(pageSize)
        .getMany();

      // Get count of unique guests by name + email combination
      const countQuery = this.guestRepository
        .createQueryBuilder('guest')
        .select('COUNT(DISTINCT(guest.firstName, guest.lastName, guest.emailAddress))', 'count')
        .where('guest.hotelId = :propertyId', { propertyId });

      if (query && query.trim()) {
        const searchTerm = `%${query.trim()}%`;
        const orConditions: string[] = [
          'guest.firstName ILIKE :searchTerm',
          'guest.lastName ILIKE :searchTerm',
          'guest.emailAddress ILIKE :searchTerm'
        ];
        const parameters: any = { searchTerm };

        if (query.trim().includes(' ')) {
          const nameParts = query.trim().split(/\s+/);
          if (nameParts.length >= 2) {
            const firstName = `%${nameParts[0]}%`;
            const lastName = `%${nameParts.slice(1).join(' ')}%`;
            orConditions.push(
              '(guest.firstName ILIKE :firstName AND guest.lastName ILIKE :lastName)'
            );
            parameters.firstName = firstName;
            parameters.lastName = lastName;
            orConditions.push(
              '(guest.firstName ILIKE :lastNameRev AND guest.lastName ILIKE :firstNameRev)'
            );
            parameters.firstNameRev = lastName;
            parameters.lastNameRev = firstName;
          }
        }
        countQuery.andWhere(`(${orConditions.join(' OR ')})`, parameters);
      }

      const countResult = await countQuery.getRawOne();
      const count = parseInt(countResult?.count || '0', 10);

      return { guests, count };
    } catch (error) {
      const err = error?.response?.data || error;
      this.logger.error('Error searching guests:', err);
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
