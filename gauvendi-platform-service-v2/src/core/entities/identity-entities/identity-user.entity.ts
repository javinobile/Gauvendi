import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { Hotel } from '../hotel-entities/hotel.entity';
import { IdentityUserAccessControl } from './identity-user-access-control.entity';

export enum IdentityUserStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

@Index(['organisationId'])
@Index(['hotelId'])
@Entity({ name: 'identity_user' })
export class IdentityUser extends BaseEntityWithDeleted {
  @Column('uuid', { name: 'organisation_id', nullable: true })
  organisationId: string | null;

  @Column('varchar', { name: 'username', nullable: true, length: 255 })
  username: string | null;

  @Column('uuid', { name: 'hotel_id', nullable: true })
  hotelId: string | null;

  @Column('varchar', { name: 'email_address', nullable: true, length: 255 })
  emailAddress: string | null;

  @Column('varchar', { name: 'first_name', nullable: true, length: 255 })
  firstName: string | null;

  @Column('varchar', { name: 'last_name', nullable: true, length: 255 })
  lastName: string | null;

  @Column('varchar', { name: 'status', nullable: true, length: 60 })
  status: IdentityUserStatusEnum | null;

  @Column('timestamptz', { name: 'last_login_activity', nullable: true })
  lastLoginActivity: Date | null;

  @ManyToOne(() => Hotel, (hotel) => hotel.users)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @OneToMany(() => IdentityUserAccessControl, (userAccessControl) => userAccessControl.user)
  userAccessControls: IdentityUserAccessControl[];
}