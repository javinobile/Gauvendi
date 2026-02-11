import { Column, Entity, Index } from 'typeorm';
import { BaseEntityWithTranslations } from '../../database/entities/base.entity';

@Entity({ name: 'country' })
@Index(['code'])
export class Country extends BaseEntityWithTranslations {
  @Column({ type: 'uuid', nullable: true, name: 'flag_image_id' })
  flagImageId: string;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'code', length: 60 })
  code: string;

  @Column({ type: 'varchar', nullable: true, name: 'phone_code', length: 20 })
  phoneCode: string;
}