import { Module } from '@nestjs/common';
import { OrganisationService } from '../services/organisation.service';
import { OrganisationSharedModule } from './organisation-shared.module';
import { OrganisationController } from '../controllers/organisation.controller';

@Module({
  imports: [OrganisationSharedModule],
  controllers: [OrganisationController],
  providers: [OrganisationService]
})
export class OrganisationModule {}
