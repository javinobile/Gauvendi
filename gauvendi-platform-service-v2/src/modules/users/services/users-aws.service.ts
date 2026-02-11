import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import axios from 'axios';

export type AwsUserInput = {
  id?: string;
  username: string;
  emailAddress: string;
  roleId: string;
  organisationId: string;
  firstName: string;
  lastName: string;
  auth0UserId: string;
};

@Injectable()
export class UsersAwsService {
  private readonly logger = new Logger(UsersAwsService.name);
  private readonly awsIdentityUrl: string;
  private readonly awsIdentityKey: string;

  constructor(private readonly configService: ConfigService) {
    const awsIdentityKey = this.configService.get(ENVIRONMENT.ADMIN_API_KEY);
    const awsIdentityUrl = this.configService.get(ENVIRONMENT.REMOTE_SERVICE_ADMIN);
    if (!awsIdentityKey || !awsIdentityUrl) {
      this.logger.warn('Missing aws identity key or url configuration');
    }
    this.awsIdentityKey = awsIdentityKey;
    this.awsIdentityUrl = `${awsIdentityUrl}/identity/user`;
  }

  async createAwsUser(input: AwsUserInput) {
    try {
      const res = await axios.post(`${this.awsIdentityUrl}/create`, input, {
        headers: {
          'gvd-admin-key': this.awsIdentityKey,
          'Content-Type': 'application/json'
        }
      });
      if (res.data.status === 'ERROR') {
        throw new InternalServerErrorException(res.data);
      }
      return res.data;
    } catch (error) {
      this.logger.error(`Failed to create aws user: ${JSON.stringify(error)}`);
      throw new BadRequestException(error.message);
    }
  }

  async updateAwsUser(input: AwsUserInput) {
    try {
      const res = await axios.post(`${this.awsIdentityUrl}/update`, input, {
        headers: {
          'gvd-admin-key': this.awsIdentityKey,
          'Content-Type': 'application/json'
        }
      });
      return res.data;
    } catch (error) {
      this.logger.error(`Failed to update aws user: ${JSON.stringify(error)}`);
      throw new BadRequestException(error.message);
    }
  }

  async deleteAwsUser(input: AwsUserInput) {
    try {
      const res = await axios.post(`${this.awsIdentityUrl}/delete`, input, {
        headers: {
          'gvd-admin-key': this.awsIdentityKey,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.status === 'ERROR') {
        throw new InternalServerErrorException(res.data);
      }

      return res.data;
    } catch (error) {
      this.logger.error(`Failed to delete aws user: ${JSON.stringify(error)}`);
      throw new BadRequestException(error.message);
    }
  }
}
