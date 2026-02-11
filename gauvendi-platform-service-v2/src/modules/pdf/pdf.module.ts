import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { S3Service } from '@src/core/s3/s3.service';
import { PdfService } from './services/pdf.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5
    })
  ],
  providers: [PdfService, S3Service],
  exports: [PdfService]
})
export class PdfModule {}
