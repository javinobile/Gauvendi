import { Connector } from '@src/core/entities/hotel-entities/connector.entity';
import { IsOptional, IsString } from 'class-validator';
import { FindOptionsRelations } from 'typeorm';

export class ConnectorDto {
  @IsString()
  hotelId: string;

  @IsString()
  @IsOptional()
  connectorType?: string;

  relations?: FindOptionsRelations<Connector>;
}
