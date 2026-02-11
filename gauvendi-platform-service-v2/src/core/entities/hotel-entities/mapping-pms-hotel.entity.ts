import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Connector } from './connector.entity';

@Entity({ name: 'mapping_pms_hotel' })
@Index(['hotelId'])
@Index(['connectorId'])
@Index(['mappingHotelCode'])
@Index(['hotelId', 'connectorId'])
@Index(['hotelId', 'mappingHotelCode'])
@Index(['connectorId', 'mappingHotelCode'])
@Index(['hotelId', 'connectorId', 'mappingHotelCode'], { unique: true })
export class MappingPmsHotel extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'varchar', nullable: true, name: 'mapping_hotel_code', length: 60 })
  mappingHotelCode: string;

  @Column({ type: 'uuid', nullable: true, name: 'connector_id' })
  connectorId: string;

  // relations  
  @ManyToOne(() => Connector, (connector) => connector.mappingPmsHotel)
  @JoinColumn({ name: 'connector_id' })
  connector: Connector;
}
