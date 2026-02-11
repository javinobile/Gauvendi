import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BadRequestException } from '@src/core/exceptions';
import {
  EmailHistory,
  EmailHistoryDocument
} from '@src/core/schemas/email-history/email-history.schema';
import { Model } from 'mongoose';

@Injectable()
export class EmailHistoryRepository {
  constructor(
    @InjectModel(EmailHistory.name) private emailHistoryModel: Model<EmailHistoryDocument>
  ) {}

  async getEmailHistoryList(filter: any) {
    try {
      const { bookingId } = filter;
      const queryBuilder = this.emailHistoryModel.find({
        ...(bookingId && { booking_id: bookingId })
      });

      return await queryBuilder.exec();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
