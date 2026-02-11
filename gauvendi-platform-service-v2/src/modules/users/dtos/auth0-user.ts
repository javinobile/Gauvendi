export interface Auth0User {
  user_id: string;
  email: string;
  email_verified: boolean;
  username: string;
  phone_number: string;
  phone_verified: boolean;
  picture: string;
  name: string;
  nickname: string;
  multifactor: string[];
  given_name: string;
  family_name: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
}
