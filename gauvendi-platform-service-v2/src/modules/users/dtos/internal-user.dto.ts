import { IdentityUserStatusEnum } from "@src/core/entities/identity-entities/identity-user.entity";


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
