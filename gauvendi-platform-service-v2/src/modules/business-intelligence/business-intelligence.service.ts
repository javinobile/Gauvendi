import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import {
  QuickSightClient,
  ListNamespacesCommand,
  ListUsersCommand,
  RegisterUserCommand,
  GetDashboardEmbedUrlCommand,
  IdentityType,
  UserRole
} from '@aws-sdk/client-quicksight';

export interface QuickSightResponse {
  url: string | null;
}

@Injectable()
export class BusinessIntelligenceService {
  private readonly logger = new Logger(BusinessIntelligenceService.name);
  private readonly quickSightClient: QuickSightClient;
  private readonly quickSightAccessKey: string;
  private readonly quickSightSecretKey: string;
  private readonly quickSightDashboardId: string;
  private readonly quickSightAwsAccountId: string;
  private readonly quickSightAwsUserArn: string;
  private readonly quickSightRegion: string;
  private readonly dashboardUserEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.quickSightAccessKey =
      this.configService.get<string>(ENVIRONMENT.QUICKSIGHT_ACCESS_KEY) ?? '';
    this.quickSightSecretKey =
      this.configService.get<string>(ENVIRONMENT.QUICKSIGHT_SECRECT_KEY) ?? '';
    this.quickSightDashboardId =
      this.configService.get<string>(ENVIRONMENT.QUICKSIGHT_DASHBOARD_ID) ?? '';
    this.quickSightAwsAccountId =
      this.configService.get<string>(ENVIRONMENT.QUICKSIGHT_AWS_ACCOUNT_ID) ?? '';
    this.quickSightAwsUserArn =
      this.configService.get<string>(ENVIRONMENT.QUICKSIGHT_AWS_USER_ARN) ?? '';
    this.quickSightRegion =
      this.configService.get<string>(ENVIRONMENT.QUICKSIGHT_REGION) ?? 'eu-central-1';
    this.dashboardUserEmail =
      this.configService.get<string>(ENVIRONMENT.QUICKSIGHT_USER_EMAIL) ??
      'dashboard.platform@gauvendi.com';

    this.quickSightClient = new QuickSightClient({
      region: this.quickSightRegion,
      credentials: {
        accessKeyId: this.quickSightAccessKey,
        secretAccessKey: this.quickSightSecretKey
      }
    });
  }

  async generateQuicksightDashboardUrl(): Promise<QuickSightResponse> {
    try {
      // Get namespace
      const listNamespacesResult = await this.quickSightClient.send(
        new ListNamespacesCommand({
          AwsAccountId: this.quickSightAwsAccountId
        })
      );

      if (!listNamespacesResult.Namespaces?.length) {
        this.logger.error('No namespaces found in QuickSight');
        return { url: null };
      }

      const namespace = listNamespacesResult.Namespaces[0].Name;

      // List users and find dashboard user
      const listUsersResult = await this.quickSightClient.send(
        new ListUsersCommand({
          AwsAccountId: this.quickSightAwsAccountId,
          Namespace: namespace
        })
      );

      const dashboardUser = listUsersResult.UserList?.find(
        (user) => user.Email === this.dashboardUserEmail
      );

      const identityType: IdentityType = 'IAM';

      // Register user if not found
      if (!dashboardUser) {
        this.logger.log(`Registering new QuickSight user: ${this.dashboardUserEmail}`);
        await this.quickSightClient.send(
          new RegisterUserCommand({
            AwsAccountId: this.quickSightAwsAccountId,
            IdentityType: identityType,
            UserRole: 'READER' as UserRole,
            Email: this.dashboardUserEmail,
            IamArn: this.quickSightAwsUserArn,
            Namespace: namespace
          })
        );
      }

      // Generate embed URL
      const getDashboardEmbedUrlResult = await this.quickSightClient.send(
        new GetDashboardEmbedUrlCommand({
          AwsAccountId: this.quickSightAwsAccountId,
          IdentityType: identityType,
          DashboardId: this.quickSightDashboardId
        })
      );

      const url = getDashboardEmbedUrlResult.EmbedUrl;

      if (url) {
        this.logger.log('Successfully generated QuickSight dashboard embed URL');
        return { url };
      }

      this.logger.error('Failed to generate QuickSight embed URL');
      return { url: null };
    } catch (error) {
      this.logger.error(`Error generating QuickSight dashboard URL: ${error.message}`, error.stack);
      return { url: null };
    }
  }
}
