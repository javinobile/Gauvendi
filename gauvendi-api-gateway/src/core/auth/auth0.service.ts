import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { ENV_CONST } from "../constants/environment.const";

export interface Auth0SignUpDto {
  email: string;
  username: string;
  password: string;
  given_name: string;
  family_name: string;
  user_metadata: Record<string, any>;
}

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

@Injectable()
export class Auth0Service {
  constructor(private readonly configService: ConfigService) {}

  private readonly defaultPassword = this.configService.get(ENV_CONST.AUTH0_DEFAULT_PASSWORD);
  private readonly auth0Domain = this.configService.get(ENV_CONST.AUTH0_MM_DOMAIN);
  private readonly clientId = this.configService.get(ENV_CONST.AUTH0_MM_CLIENT_ID);
  private readonly clientSecret = this.configService.get(ENV_CONST.AUTH0_MM_CLIENT_SECRET);
  private readonly audience = `https://${this.auth0Domain}/api/v2/`;
  private readonly connection = "PlatformUser";

  async getAuth0Token(): Promise<string> {
    const response = await axios.post(`https://${this.auth0Domain}/oauth/token`, {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      audience: this.audience,
      grant_type: "client_credentials",
    });
    return response.data.access_token;
  }

  async getHeadersCredentials() {
    const token = await this.getAuth0Token();
    return { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" };
  }

  async updateUserMetadata(userId: string, metadata: Record<string, any>) {
    const headers = await this.getHeadersCredentials();
    const response = await axios.patch(`https://${this.auth0Domain}/api/v2/users/${userId}`, { user_metadata: metadata }, { headers });

    return response.data;
  }

  async createUser(user: Auth0SignUpDto): Promise<Auth0User> {
    const headers = await this.getHeadersCredentials();

    const password = user.password || this.defaultPassword;

    const response = await axios.post(
      `https://${this.auth0Domain}/api/v2/users`,
      {
        connection: this.connection,
        email: user.email,
        username: user.username,
        password: password,
        given_name: user.given_name,
        family_name: user.family_name,
        user_metadata: {},
        blocked: false,
        email_verified: false,
        app_metadata: {},
        name: user.given_name + " " + user.family_name,
        nickname: user.given_name + " " + user.family_name,
        verify_email: false,
      },
      {
        headers,
      }
    );
    return response.data;
  }

  async resetPassword(email: string) {
    const headers = await this.getHeadersCredentials();
    try {
      const response = await axios.post(
        `https://${this.auth0Domain}/dbconnections/change_password`,
        {
          client_id: this.clientId,
          email: email,
          connection: this.connection,
        },
        {
          headers,
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async changePassword(userId: string, password: string) {
    const headers = await this.getHeadersCredentials();
    const response = await axios.patch(
      `https://${this.auth0Domain}/api/v2/users/${userId}`,
      {
        password,
        connection: this.connection,
      },
      {
        headers,
      }
    );

    return response.data;
  }

  async getUserById(userId: string) {
    const headers = await this.getHeadersCredentials();
    const response = await axios.get(`https://${this.auth0Domain}/api/v2/users/${userId}`, { headers });
    return response.data;
  }

  async getAllUsers() {
    const headers = await this.getHeadersCredentials();
    const response = await axios.get(`https://${this.auth0Domain}/api/v2/users`, { headers });
    return response.data;
  }

  async deleteAllUsers() {
    const headers = await this.getHeadersCredentials();
    const response = await axios.get(`https://${this.auth0Domain}/api/v2/users`, { headers });
    for (const user of response.data) {
      await axios.delete(`https://${this.auth0Domain}/api/v2/users/${user.user_id}`, { headers });
    }
  }

  async deleteUserById(userId: string) {
    const headers = await this.getHeadersCredentials();
    const response = await axios.delete(`https://${this.auth0Domain}/api/v2/users/${userId}`, { headers });
    return response.data;
  }

  async updateUserById(userId: string, userData: Record<string, any>) {
    const headers = await this.getHeadersCredentials();
    const response = await axios.patch(`https://${this.auth0Domain}/api/v2/users/${userId}`, userData, { headers });
    return response.data;
  }

  // async assignRolesToUser(userId: string, roles: string[]) {
  //   const headers = await this.getHeadersCredentials();
  //   const response = await axios.post(
  //     `https://${this.auth0Domain}/api/v2/users/${userId}/roles`,
  //     {
  //       roles,
  //     },
  //     {
  //       headers,
  //     }
  //   );
  //   return response.data;
  // }
}
