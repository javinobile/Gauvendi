import { Module } from '@nestjs/common';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [IntegrationController],
  providers: [IntegrationService],
  imports: [PlatformClientModule]
})
export class IntegrationModule {}
