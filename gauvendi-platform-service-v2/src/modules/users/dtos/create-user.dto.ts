import { Auth0User } from "./auth0-user";



export interface CreateUserDto {
  emailAddress: string;
  firstName: string;
  lastName: string;
  organisationId: string;
  roleId: string;
  username: string;
  auth0User: Auth0User;
  hotelId?: string;
}