import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { OrganisationController } from "./organisation.controller";
import { OrganisationService } from "./organisation.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [OrganisationController],
  providers: [OrganisationService],
})
export class OrganisationModule {}
