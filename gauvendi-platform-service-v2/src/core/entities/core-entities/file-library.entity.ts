import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity({ name: 'file_library' })
export class FileLibrary extends BaseEntity {
  @Column({ type: 'varchar', nullable: true, name: 'original_name', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', nullable: true, name: 'content_type', length: 40 })
  contentType: string;

  @Column({ type: 'varchar', nullable: true, name: 'url', length: 255 })
  url: string;

  @Column({ type: 'bigint', nullable: true, name: 'file_size' })
  fileSize: number;
}