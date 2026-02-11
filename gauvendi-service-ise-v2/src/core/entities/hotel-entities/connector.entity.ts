import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Hotel } from './hotel.entity';
import { MappingPmsHotel } from './mapping-pms-hotel.entity';
import { Organisation } from './organisation.entity';

export enum ConnectorTypeEnum {
  APALEO = 'apaleo',
  MEWS = 'Mews',
  OHIP = 'Ohip'
}

export enum ConnectorStatusEnum {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  INACTIVE = 'INACTIVE'
}

@Entity({ name: 'connector' })
@Index(['organisationId'])
@Index(['hotelId'])
@Index(['connectorType'])
@Index(['status'])
export class Connector extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'organisation_id' })
  organisationId: string;

  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'text', nullable: true, name: 'refresh_token' })
  refreshToken: string;

  @Column({ type: 'varchar', nullable: false, name: 'connector_type', length: 50 })
  connectorType: ConnectorTypeEnum;

  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, any>;

  @Column({
    type: 'varchar',
    nullable: false,
    name: 'status',
    length: 20,
    default: ConnectorStatusEnum.ACTIVE
  })
  status: ConnectorStatusEnum;

  @Column({ type: 'varchar', nullable: true, name: 'account_id', length: 10 })
  accountId: string;

  // Relations
  @ManyToOne(() => Organisation, { nullable: false })
  @JoinColumn({ name: 'organisation_id' })
  organisation: Organisation;

  @ManyToOne(() => Hotel, { nullable: true })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @OneToMany(() => MappingPmsHotel, (mappingPmsHotel) => mappingPmsHotel.connector)
  mappingPmsHotels: MappingPmsHotel[];

  @OneToMany(() => MappingPmsHotel, (mappingPmsHotel) => mappingPmsHotel.connector)
  mappingPmsHotel: MappingPmsHotel[];
}
