import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailHistoryDocument = EmailHistory & Document;

@Schema({
  collection: 'email_history',
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
})
export class EmailHistory {
  @Prop({ required: false })
  booking_id?: string;

  @Prop({ required: false })
  reservation_id?: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  sender_name: string;

  @Prop({ required: true })
  sender_email: string;

  @Prop({ required: true })
  recipient_email: string;

  @Prop({ required: false })
  subject?: string;

  @Prop({ required: true, enum: ['Pending', 'Sent', 'Failed'], default: 'Pending' })
  status: string;

  @Prop({ required: false })
  delivered_date?: Date;

  @Prop({ type: Date })
  created_date?: Date;

  @Prop({ type: Date })
  updated_date?: Date;
}

export const EmailHistorySchema = SchemaFactory.createForClass(EmailHistory);
