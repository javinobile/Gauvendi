import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

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

  @Column('jsonb', { name: 'permissions', nullable: true })
  permissions: string | null;
}
