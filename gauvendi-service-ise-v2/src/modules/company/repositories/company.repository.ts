import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from 'src/core/entities/booking-entities/company.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { GuestDto } from 'src/modules/booking/dtos/request-booking.dto';
import { DB_NAME } from 'src/core/constants/db.const';

@Injectable()
export class CompanyRepository {
  private readonly logger = new Logger(CompanyRepository.name);

  constructor(
    @InjectRepository(Company, DB_NAME.POSTGRES)
    private companyRepository: Repository<Company>
  ) {}

  async createCompany(data: GuestDto, hotelId: string): Promise<Company | null> {
    const {
      companyName,
      companyAddress,
      companyCity,
      companyCountry,
      companyPostalCode,
      companyEmail,
      companyTaxId
    } = data;
    if (!companyName) {
      this.logger.warn('Company name is required');
      return null;
    }

    const company = this.companyRepository.create({
      id: uuidv4(),
      name: companyName || null,
      address: companyAddress || null,
      city: companyCity || null,
      country: companyCountry || null,
      postalCode: companyPostalCode || null,
      email: companyEmail || null,
      taxId: companyTaxId || null,
      hotelId: hotelId,
      createdBy: 'system',
      createdAt: new Date(),
      updatedBy: 'system',
      updatedAt: new Date()
    });

    try {
      return await this.companyRepository.save(company);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
