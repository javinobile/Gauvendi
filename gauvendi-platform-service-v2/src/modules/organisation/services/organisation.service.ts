import { Injectable } from '@nestjs/common';
import { Organisation } from '@src/core/entities/hotel-entities/organisation.entity';
import { OrganisationRepository } from '../repositories/organisation.repository';

@Injectable()
export class OrganisationService {
  constructor(private readonly organisationRepository: OrganisationRepository) {}

  async getOrganisations() {
    const [organisations, totalCount] = await this.organisationRepository.getOrganisations();
    const mappedOrganisations = this.mapOrganisations(organisations);
    return {
      data: mappedOrganisations,
      totalPage: 1,
      count: totalCount
    };
  }

  private mapOrganisations(data: Organisation[]): any[] {
    return data?.map((organisation) => {
      return {
        id: organisation.id,
        name: organisation.name,
        code: organisation.code,
        initialSetup: organisation.initialSetup
      };
    });
  }
}
