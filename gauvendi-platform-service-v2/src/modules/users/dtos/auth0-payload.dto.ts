export interface Auth0Payload {
    email_address: string;
    user_id: string;
    user_name: string;
    organisation_id: string;
    full_name: string;
    permission_codes: string[];
    is_email_verified: boolean;
    onboarded_admin_sign_up: boolean;
    iss: string;
    sub: string;
    aud: string;
    iat: number;
    exp: number;
    scope: string;
    azp: string;
  }
  