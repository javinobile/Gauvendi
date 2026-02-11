import { Column, Entity } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';

@Entity({ name: 'identity_permission' })
export class IdentityPermission extends BaseEntityWithDeleted {
  @Column('varchar', { name: 'name', nullable: true })
  name: string | null;

  @Column('varchar', { name: 'code', nullable: true, length: 255 })
  code: string | null;
}
