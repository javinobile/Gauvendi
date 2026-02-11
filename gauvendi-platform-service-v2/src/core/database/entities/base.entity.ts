import { LanguageCodeEnum } from '@enums/common';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'created_by', select: false })
  createdBy: string;

  @Column({ type: 'text', nullable: true, name: 'updated_by', select: false })
  updatedBy: string;
}

export abstract class BaseEntityWithDeleted extends BaseEntity {
  @DeleteDateColumn({ type: 'timestamptz', nullable: true, name: 'deleted_at', select: false })
  deletedAt: Date | null;
}

export interface Translation {
  languageCode: LanguageCodeEnum;
  name?: string;
  description?: string;
  [key: string]: any;
}

export abstract class BaseEntityWithTranslations extends BaseEntity {
  @Column({ type: 'jsonb', nullable: false, name: 'translations', default: '[]' })
  translations: Translation[];
}

export abstract class BaseEntityWithTranslationsDeleted extends BaseEntity {
  @Column({ type: 'jsonb', nullable: false, name: 'translations', default: '[]' })
  translations: Translation[];

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, name: 'deleted_at', select: false })
  deletedAt?: Date | null;
}
