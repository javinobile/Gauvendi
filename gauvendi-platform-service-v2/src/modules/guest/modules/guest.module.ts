import { Module } from '@nestjs/common';
import { GuestController } from '../controllers/guest.controller';
import { GuestService } from '../services/guest.service';
import { GuestSharedModule } from './guest-shared.module';

@Module({
  imports: [GuestSharedModule],
  controllers: [GuestController],
  providers: [GuestService],
  exports: [GuestService]
})
export class GuestModule {}
