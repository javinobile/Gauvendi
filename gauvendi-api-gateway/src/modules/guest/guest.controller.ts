import { Controller, Get } from "@nestjs/common";
import { Public } from "@src/core/decorators/is-public.decorator";
import { GuestService } from "./guest.service";

@Controller("guest")
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  @Public()
  @Get("admin-sync-guests")
  adminSyncGuests() {
    return this.guestService.adminSyncGuests();
  }
}
