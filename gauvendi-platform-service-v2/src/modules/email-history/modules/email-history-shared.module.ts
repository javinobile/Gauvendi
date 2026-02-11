import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmailHistory,
  EmailHistorySchema
} from '@src/core/schemas/email-history/email-history.schema';
import { EmailHistoryRepository } from '../repositories/email-history.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: EmailHistory.name, schema: EmailHistorySchema }])],
  providers: [EmailHistoryRepository],
  exports: [EmailHistoryRepository]
})
export class EmailHistorySharedModule {}
