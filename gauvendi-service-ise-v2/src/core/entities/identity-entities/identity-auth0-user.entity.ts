import { Column, Entity, Index } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';

@Index(['userId'])
@Index(['auth0UserId'])
@Entity({ name: 'identity_auth0_user' })
export class IdentityAuth0User extends BaseEntityWithDeleted {
  @Column('uuid', { name: 'user_id', nullable: true })
  userId: string | null;

  @Column('uuid', { name: 'auth0_user_id', nullable: true })
  auth0UserId: string | null;
}
