import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { IdentityUser } from './identity-user.entity';
import { IdentityAccessControl } from './identity-access-control.entity';

@Index(['accessControlId'])
@Index(['userId'])
@Entity({ name: 'identity_user_access_control' })
export class IdentityUserAccessControl extends BaseEntityWithDeleted {
  @Column('uuid', { name: 'user_id', nullable: true })
  userId: string | null;

  @Column('uuid', { name: 'access_control_id', nullable: true })
  accessControlId: string | null;

  @ManyToOne(() => IdentityUser, (user) => user.userAccessControls)
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;

  @ManyToOne(() => IdentityAccessControl, (accessControl) => accessControl.userAccessControls)
  @JoinColumn({ name: 'access_control_id' })
  accessControl: IdentityAccessControl;
}
