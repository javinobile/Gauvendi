import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { IdentityAccessControl } from '@src/core/entities/identity-entities/identity-access-control.entity';
import { IdentityAuth0User } from '@src/core/entities/identity-entities/identity-auth0-user.entity';
import { IdentityRole } from '@src/core/entities/identity-entities/identity-role.entity';
import { IdentityUserAccessControl } from '@src/core/entities/identity-entities/identity-user-access-control.entity';
import { IdentityUser } from '@src/core/entities/identity-entities/identity-user.entity';
import { UsersAwsService } from './services/users-aws.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersAwsService],
  imports: [
    TypeOrmModule.forFeature([
      IdentityUser,
      IdentityUserAccessControl,
      IdentityAccessControl,
      IdentityRole,
      Hotel,
      IdentityAuth0User
    ], DbName.Postgres)
  ],
})
export class UsersModule {}
