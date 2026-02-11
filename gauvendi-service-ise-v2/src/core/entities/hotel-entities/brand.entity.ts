import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity({ name: 'brand' })
export class Brand extends BaseEntity {
  @Column({ type: 'varchar', nullable: false, name: 'name', length: 255 })
  name: string;
}
