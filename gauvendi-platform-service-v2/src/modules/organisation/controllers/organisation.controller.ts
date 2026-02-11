import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { OrganisationService } from '../services/organisation.service';

@Controller()
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @MessagePattern({ cmd: CMD.ORGANISATION.GET_LIST })
  async organisationList() {
    return await this.organisationService.getOrganisations();
  }
}
