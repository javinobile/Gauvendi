import { RoleDto } from './role.dto';
import { PropertyPermissionDto } from './property-permission.dto';

export enum UserStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export class UserDto {
  id: string;
  username?: string;
  hotelId?: string;
  organisationId?: string;
  emailAddress: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  status: UserStatusEnum;
  lastLoginActivity?: Date;
  permissions?: string[];
  propertyIdList?: string[];
  role?: RoleDto;
  propertyPermissionList?: PropertyPermissionDto[];
  createdDate?: Date;
}
