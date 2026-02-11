import { IdentityUserStatusEnum } from "@src/core/entities/identity-entities/identity-user.entity";

export interface UpdateUserDto {
    id: string;
    emailAddress: string;
    firstName: string;
    lastName: string;
    roleId: string;
    username: string;
    status: IdentityUserStatusEnum;
}