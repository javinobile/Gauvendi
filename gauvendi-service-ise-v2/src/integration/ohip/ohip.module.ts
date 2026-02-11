import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { OhipService } from './ohip.service';

@Module({
  imports: [HttpModule],
  exports: [OhipService],
  providers: [OhipService]
})
export class OhipModule {}
