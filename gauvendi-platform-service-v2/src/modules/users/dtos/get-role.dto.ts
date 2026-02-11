import { IdentityRoleGroupEnum } from "@src/core/entities/identity-entities/identity-role.entity";

export interface GetRoleDto {
  groupList: IdentityRoleGroupEnum[];
}
