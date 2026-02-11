import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { Organisation } from '@src/core/entities/hotel-entities/organisation.entity';
import { OrganisationRepository } from '../repositories/organisation.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Organisation], DbName.Postgres)],
  providers: [OrganisationRepository],
  exports: [OrganisationRepository]
})
export class OrganisationSharedModule {}
