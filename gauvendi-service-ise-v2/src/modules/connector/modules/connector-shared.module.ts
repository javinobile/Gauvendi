import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Connector } from 'src/core/entities/hotel-entities/connector.entity';
import { ConnectorRepository } from '../repositories/connector.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Connector], DB_NAME.POSTGRES), ConfigModule],
  providers: [ConnectorRepository],
  exports: [ConnectorRepository]
})
export class ConnectorSharedModule {}
