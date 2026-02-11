import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';

@Entity('image')
@Index(['hotelId', 'imageUrl'])
export class Image extends BaseEntity {
  @Column('varchar', { name: 'image_url', nullable: true, length: 255 })
  imageUrl: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ nullable: true, name: 'sequence', type: 'integer' })
  sequence: number;

  @Column({ nullable: true, name: 'size', type: 'bigint' })
  size: number;

  @Column({ nullable: true, name: 'mime_type', type: 'varchar' })
  mimeType: string;

  @Column({ nullable: true, name: 'file_name', type: 'varchar' })
  fileName: string;
}
