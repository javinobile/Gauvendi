import { IdentityUserStatusEnum } from "@src/core/enums/common.enum";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export interface InternalUserDto {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  status: IdentityUserStatusEnum;
  auth0UserId: string;
  organisationId: string;
  lastLoginActivity: Date;
  createdDate: Date;
  role: {
    id: string;
    code: string;
    name: string;
    group: string;
  };
}

export class AssignUsersToHotelInfraDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEmail()
  @IsNotEmpty()
  emailAddress: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;
  
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  auth0Id: string;

  @IsString()
  @IsOptional()
  @IsUUID()
  hotelId?: string;
}
export class UnassignUsersToHotelInfraDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

}