import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  DeleteDateColumn
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

export enum LanguageCodeEnum {
  EN = 'EN',
  FR = 'FR',
  DE = 'DE',
  IT = 'IT',
  ES = 'ES',
  PT = 'PT',
  NL = 'NL',
  AR = 'AR'
}

export interface Translation {
  languageCode: LanguageCodeEnum;
  name: string;
  description: string;
  measurementUnit?: string;
  payAtHotelDescription?: string;
  payOnConfirmationDescription?: string;
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
