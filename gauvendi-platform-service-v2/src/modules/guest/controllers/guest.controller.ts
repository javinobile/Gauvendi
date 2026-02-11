import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { GuestService } from '../services/guest.service';

@Controller()
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  @MessagePattern({ cmd: CMD.GUEST.ADMIN_SYNC_GUESTS })
  async adminSyncGuests() {
    return this.guestService.adminSyncGuests();
  }
}
