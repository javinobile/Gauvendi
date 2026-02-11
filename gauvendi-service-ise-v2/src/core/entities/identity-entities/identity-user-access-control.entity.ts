import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Index(['accessControlId'])
@Index(['userId'])
@Entity({ name: 'identity_user_access_control' })
export class IdentityUserAccessControl extends BaseEntityWithDeleted {
  @Column('uuid', { name: 'user_id', nullable: true })
  userId: string | null;

  @Column('uuid', { name: 'access_control_id', nullable: true })
  accessControlId: string | null;
}
