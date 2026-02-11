import { PropertyDto } from './property.dto';
import { RoleDto } from './role.dto';

export class PropertyPermissionDto {
  property: PropertyDto;
  role: RoleDto | null;
  permissionCodes: string[];
}
