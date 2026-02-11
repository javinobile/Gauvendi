import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Column, Entity } from 'typeorm';

export enum IdentityRoleGroupEnum {
  ORGANISATION = 'ORGANISATION',
  PROPERTY = 'PROPERTY'
}

@Entity({ name: 'identity_role' })
export class IdentityRole extends BaseEntityWithDeleted {
  @Column('varchar', { name: 'name', nullable: true, length: 255 })
  name: string | null;

  @Column('varchar', { name: 'code', nullable: true, length: 255 })
  code: string | null;

  @Column('jsonb', { name: 'permissions', nullable: true })
  permissions: string[] | null;

  @Column('varchar', { name: 'group', nullable: true, length: 60 })
  group: IdentityRoleGroupEnum | null;
}
