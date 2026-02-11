import { Module } from '@nestjs/common';
import { Auth0Module } from '@src/core/auth/auth.module';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [PlatformClientModule, Auth0Module],
})
export class AuthModule {}
