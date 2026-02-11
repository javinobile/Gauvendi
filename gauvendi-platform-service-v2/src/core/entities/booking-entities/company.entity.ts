import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Reservation } from './reservation.entity';

@Entity({ name: 'company' })
@Index(['taxId'])
export class Company extends BaseEntityWithDeleted {
  @Column('varchar', { name: 'name', nullable: true, length: 1000 })
  name: string | null;

  @Column('varchar', { name: 'tax_id', nullable: true, length: 255 })
  taxId: string | null;

  @Column('varchar', { name: 'email', nullable: true, length: 255 })
  email: string | null;

  @Column('varchar', { name: 'address', nullable: true, length: 4000 })
  address: string | null;

  @Column('varchar', { name: 'city', nullable: true, length: 255 })
  city: string | null;

  @Column('varchar', { name: 'country', nullable: true, length: 255 })
  country: string | null;

  @Column('varchar', { name: 'postal_code', nullable: true, length: 255 })
  postalCode: string | null;

  @Column('uuid', { name: 'hotel_id', nullable: true })
  hotelId: string | null;

  @Column({ nullable: true, name: 'mapping_pms_code', type: 'text' })
  mappingPmsCode: string;

  //relations
  @OneToMany(() => Reservation, (reservation) => reservation.company)
  reservations: Reservation[];
}
