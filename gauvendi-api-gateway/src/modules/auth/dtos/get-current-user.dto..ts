export class RoleDto {
  id: string;
  code: string;
  name: string;
  group: string;
}

export class PropertyDto {
  id: string;
  code: string;
  name: string;
  initialSetup: boolean;
}

export class PropertyPermissionDto {
  property: PropertyDto;
  role: RoleDto | null;
  permissionCodes: string[];
}

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
