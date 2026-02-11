import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { IdentityRole } from './identity-role.entity';
import { Hotel } from '../hotel-entities/hotel.entity';
import { IdentityUserAccessControl } from './identity-user-access-control.entity';

@Index('idx_organisationId_hotelId', ['organisationId', 'hotelId'], {})
@Index(['roleId'])
@Entity({ name: 'identity_access_control' })
export class IdentityAccessControl extends BaseEntityWithDeleted {
  @Column('uuid', { name: 'role_id', nullable: true })
  roleId: string | null;

  @Column('uuid', { name: 'organisation_id', nullable: true })
  organisationId: string | null;

  @Column('uuid', { name: 'hotel_id', nullable: true })
  hotelId: string | null;

  @Column('varchar', { name: 'permissions', nullable: true, array: true })
  permissions: string[] | null;

  @ManyToOne(() => IdentityRole, (role) => role.accessControls)
  @JoinColumn({ name: 'role_id' })
  role: IdentityRole;

  @ManyToOne(() => Hotel)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @OneToMany(
    () => IdentityUserAccessControl,
    (userAccessControl) => userAccessControl.accessControl
  )
  userAccessControls: IdentityUserAccessControl[];
}
