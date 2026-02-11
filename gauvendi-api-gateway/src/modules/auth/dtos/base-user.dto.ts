import { IdentityUserStatusEnum } from "@src/core/enums/common.enum";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  emailAddress: string;

  @IsOptional()
  password?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  lastName: string;

  @IsNotEmpty()
  @IsUUID()
  roleId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  username: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsEnum(IdentityUserStatusEnum)
  status: IdentityUserStatusEnum;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class ValidateUserDto {
  @IsOptional()
  @IsString()
  emailAddress?: string;

  @IsOptional()
  @IsString()
  username: string;
}
