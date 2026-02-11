import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity({ name: 'organisation' })
@Index(['code'])
@Index(['name'])
export class Organisation extends BaseEntity {
  @Column({ type: 'varchar', nullable: true, name: 'code', length: 60 })
  code: string;

  @Column({ type: 'varchar', nullable: true, name: 'phoneCode', length: 15 })
  phoneCode: string;

  @Column({ type: 'varchar', nullable: true, name: 'phoneNumber', length: 15 })
  phoneNumber: string;

  @Column({ type: 'jsonb', nullable: true, name: 'email_address' })
  emailAddress: string[];

  @Column({ type: 'varchar', nullable: true, name: 'city', length: 60 })
  city: string;

  @Column({ type: 'varchar', nullable: true, name: 'state', length: 60 })
  state: string;

  @Column({ type: 'varchar', nullable: true, name: 'country', length: 60 })
  country: string;

  @Column({ type: 'varchar', nullable: true, name: 'postal_code', length: 60 })
  postalCode: string;

  @Column({ type: 'varchar', nullable: true, name: 'address', length: 250 })
  address: string;

  @Column({ type: 'boolean', nullable: true, name: 'initial_setup' })
  initialSetup: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;
}
