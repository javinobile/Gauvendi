import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { BooleanTransform } from "@src/core/decorators/boolean-transform.decorator";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

export class GetHotelMembersDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @BooleanTransform()
  @IsOptional()
  isAssigned?: boolean;

  @OptionalArrayProperty()
  @IsString({ each: true })
  @IsOptional()
  ids?: string[];
}

export class UpdateHotelMemberRoleDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  roleId: string;
}

export class UnassignHotelMemberItemDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  hotelId: string;
}

export class UnassignHotelMemberDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnassignHotelMemberItemDto)
  @IsNotEmpty()
  items: UnassignHotelMemberItemDto[];
}

export class AssignHotelMemberItemDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  roleId: string;
}

export class AssignHotelMemberDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignHotelMemberItemDto)
  @IsNotEmpty()
  items: AssignHotelMemberItemDto[];
}
