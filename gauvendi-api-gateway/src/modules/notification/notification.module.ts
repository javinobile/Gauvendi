import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
