import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

export enum HotelTemplateEmailCodeEnum {
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  BOOKING_CONFIRMATION_V2 = 'BOOKING_CONFIRMATION_V2',
  RESERVATION_CANCELLATION = 'RESERVATION_CANCELLATION',
  VOICE_BOOKING_CONFIRMATION = 'VOICE_BOOKING_CONFIRMATION',
  PROPOSAL_BOOKING_CONFIRMATION = 'PROPOSAL_BOOKING_CONFIRMATION',
  RELEASED_EMAIL = 'RELEASED_EMAIL',
  CPP_BOOKING_CONFIRMATION = 'CPP_BOOKING_CONFIRMATION',
  CPP_VERIFY_BOOKING_CONFIRMATION = 'CPP_VERIFY_BOOKING_CONFIRMATION',
  CPP_PROPOSAL_BOOKING_CONFIRMATION = 'CPP_PROPOSAL_BOOKING_CONFIRMATION'
}

@Entity({ name: 'hotel_template_email' })
@Index(['hotelId'])
@Index(['code'])
@Index(['languageCode'])
@Index(['templateId'])
@Index(['isDefault'])
@Index(['isEnable'])
@Index(['hotelId', 'code'])
@Index(['hotelId', 'languageCode'])
@Index(['hotelId', 'code', 'languageCode'], { unique: true })
export class HotelTemplateEmail extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'varchar', nullable: false, name: 'code', length: 60 })
  code: string;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 100 })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'language_code', length: 60 })
  languageCode: string;

  @Column({ type: 'varchar', nullable: false, name: 'template_id', length: 60 })
  templateId: string;

  @Column({ type: 'text', nullable: true, name: 'opening_section' })
  openingSection: string;

  @Column({ type: 'text', nullable: true, name: 'opening_section_for_returning_guest' })
  openingSectionForReturningGuest: string;

  @Column({ type: 'text', nullable: true, name: 'closing_section' })
  closingSection: string;

  @Column({ type: 'text', nullable: true, name: 'signature' })
  signature: string;

  @Column({ type: 'boolean', nullable: true, name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ type: 'text', nullable: true, name: 'title' })
  title: string;

  @Column({ type: 'boolean', nullable: true, name: 'is_enable', default: true })
  isEnable: boolean;
}
