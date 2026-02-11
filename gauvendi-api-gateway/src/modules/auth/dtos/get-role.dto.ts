import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { IdentityRoleGroupEnum } from "@src/core/enums/common.enum";
import { IsEnum } from "class-validator";

export class GetRoleDto {

  @OptionalArrayProperty()
  @IsEnum(IdentityRoleGroupEnum, { each: true })
  groupList: IdentityRoleGroupEnum[];
}
