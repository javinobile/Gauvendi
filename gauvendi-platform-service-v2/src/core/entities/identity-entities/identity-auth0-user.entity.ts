import { Column, Entity, Index } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';

@Index(['userId'])
@Index(['auth0UserId'])
@Entity({ name: 'identity_auth0_user' })
export class IdentityAuth0User extends BaseEntityWithDeleted {
  @Column('uuid', { name: 'user_id', nullable: true })
  userId: string | null;

  @Column('varchar', { name: 'auth0_user_id', nullable: true, length: 255 })
  auth0UserId: string | null;
}
