import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'currency' })
@Index(['code'])
export class Currency extends BaseEntity {
  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'code', length: 60 })
  code: string;
}