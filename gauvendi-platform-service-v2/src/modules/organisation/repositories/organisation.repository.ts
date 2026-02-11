import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { Organisation } from '@src/core/entities/hotel-entities/organisation.entity';
import { BadRequestException } from '@src/core/exceptions';
import { IsNull, Repository } from 'typeorm';

@Injectable()
export class OrganisationRepository {
  constructor(
    @InjectRepository(Organisation, DbName.Postgres)
    private readonly organisationRepository: Repository<Organisation>
  ) {}

  async getOrganisations() {
    try {
      return await this.organisationRepository.findAndCount({
        where: {}
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
