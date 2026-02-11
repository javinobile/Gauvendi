import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntityWithTranslationsDeleted } from '../../database/entities/base.entity';
import { BlockDaily } from './block-daily.entity';

@Index(['hotelId'])
@Index(['mappingPmsCode'])
@Entity('group_booking')
export class GroupBooking extends BaseEntityWithTranslationsDeleted {
  @Column({ type: 'uuid', nullable: false })
  hotelId: string;

  @Column({ type: 'varchar', nullable: true })
  mappingPmsCode: string;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  // relations
  @OneToMany(() => BlockDaily, (b) => b.groupBooking, {
    onDelete: 'CASCADE'
  })
  blocks: BlockDaily[];
}
