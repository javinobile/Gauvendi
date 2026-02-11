import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'supported_reservation_source' })
export class SupportedReservationSource extends BaseEntityWithDeleted {
  @Column('varchar', { name: 'code', length: 50 })
  code: string;

  @Column('varchar', { name: 'name', length: 255 })
  name: string;
}
