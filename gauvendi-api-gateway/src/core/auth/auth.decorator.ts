import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { PermissionsGuard } from "../guards/permissions.guard";

export const PERMISSIONS_KEY = "permissions";
export function Auth(...permissions: string[]) {
  return applyDecorators(SetMetadata(PERMISSIONS_KEY, permissions), UseGuards(PermissionsGuard));
}
