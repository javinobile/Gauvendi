import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";

@Injectable()
export class GuestService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  adminSyncGuests() {
    return this.clientProxy.send({ cmd: CMD.GUEST.ADMIN_SYNC_GUESTS }, {});
  }
}
