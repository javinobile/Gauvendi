import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { GlobalPaymentMethod } from '@src/core/entities/hotel-entities/global-payment-method.entity';
import { GlobalPaymentProvider } from '@src/core/entities/hotel-entities/global-payment-provider.entity';
import { HotelPaymentMethodSetting } from '@src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import {
  GlobalPaymentProviderCodeEnum,
  PaymentMethodStatusEnum,
  SupportedPaymentMethodCodes
} from '@src/core/enums/common';
import { BadRequestException, ValidationException } from '@src/core/exceptions';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { GlobalPaymentProviderRepository } from '@src/modules/global-payment-provider/repositories/global-payment-provider.repository';
import { HotelPaymentMethodSettingRepository } from '@src/modules/hotel-payment-method-setting/repositories/hotel-payment-method-setting.repository';
import { HotelPaymentTermRepository } from '@src/modules/hotel-payment-term/repositories/hotel-payment-term.repository';
import { RatePlanPaymentTermSettingRepository } from '@src/modules/rate-plan-payment-term-setting/repositories/rate-plan-payment-term-setting.repository';
import { HotelsService } from '@src/modules/hotels/hotels.service';
import { MappingPmsHotelRepository } from '@src/modules/mapping-pms-hotel/repositories/mapping-pms-hotel.repository';
import { ConnectorRepository } from '@src/modules/connector/repositories/connector.repository';
import { PmsService } from '@src/modules/pms/pms.service';
import { ConnectorTypeEnum } from '@src/core/enums/common';
import {
  ActivateHotelPaymentMethodInputDto,
  DeactivateHotelPaymentMethodInputDto,
  GeneratePaymentOnboardingUrlInputDto,
  GlobalPaymentMethodFilterDto,
  GlobalPaymentMethodResponseDto,
  PaymentOnboardingDto,
  PayPalMerchantOnboardingStatusDto,
  PropertyPaymentMethodSettingDto
} from '../dtos/global-payment-method.dto';
import { GlobalPaymentMethodRepository } from '../repositories/global-payment-method.repository';

@Injectable()
export class GlobalPaymentMethodService {
  constructor(
    private readonly globalPaymentMethodRepository: GlobalPaymentMethodRepository,
    private readonly globalPaymentProviderRepository: GlobalPaymentProviderRepository,
    private readonly hotelPaymentMethodSettingRepository: HotelPaymentMethodSettingRepository,
    private readonly hotelPaymentTermRepository: HotelPaymentTermRepository,
    private readonly ratePlanPaymentTermSettingRepository: RatePlanPaymentTermSettingRepository,
    private readonly hotelsService: HotelsService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly mappingPmsHotelRepository: MappingPmsHotelRepository,
    private readonly connectorRepository: ConnectorRepository,
    private readonly pmsService: PmsService
  ) {}

  async getGlobalPaymentMethods(filter: GlobalPaymentMethodFilterDto) {
    const data = await this.globalPaymentMethodRepository.getGlobalPaymentMethodList(filter);
    const mappedData = this.mapGlobalPaymentMethods(data, filter.hotelId);
    return mappedData;
  }

  async mapGlobalPaymentMethods(data: GlobalPaymentMethod[], hotelId?: string) {
    if (!data?.length) return [];
    if (!hotelId) return data || [];

    let paymentMethodIds: string[] = [];
    let paymentProviderCodes: string[] = [];

    for (const item of data) {
      paymentMethodIds.push(item.id);
      paymentProviderCodes.push(...(item.supportedPaymentProviderCodes || []));
    }

    paymentMethodIds = [...new Set(paymentMethodIds)];
    paymentProviderCodes = [...new Set(paymentProviderCodes)];

    const [paymentMethodSettingsData, paymentProvidersData] = await Promise.all([
      this.hotelPaymentMethodSettingRepository.getHotelPaymentMethodSettings({
        hotelId: hotelId,
        paymentMethodIds: paymentMethodIds,
        status: PaymentMethodStatusEnum.ACTIVE
      }),
      this.globalPaymentProviderRepository.getGlobalPaymentProviderList({
        codes: paymentProviderCodes
      })
    ]);
    const mapPaymentMethodSettingsData: Map<string, HotelPaymentMethodSetting> =
      paymentMethodSettingsData.reduce((acc, item) => {
        acc.set(item.globalPaymentMethodId, item);
        return acc;
      }, new Map());
    const mapPaymentProvidersData: Map<string, GlobalPaymentProvider> = paymentProvidersData.reduce(
      (acc, item) => {
        acc.set(item.code, item);
        return acc;
      },
      new Map()
    );

    const mappedData: GlobalPaymentMethodResponseDto[] = data.map((item) => {
      const paymentMethodSetting = mapPaymentMethodSettingsData.get(item.id);
      const newItem: GlobalPaymentMethodResponseDto = {
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        supportedPaymentProviderCodeList: item.supportedPaymentProviderCodes,
        paymentProviderList: item.supportedPaymentProviderCodes?.map((code) => {
          const paymentProvider = mapPaymentProvidersData.get(code);
          return {
            id: paymentProvider?.id || '',
            code: paymentProvider?.code || '',
            name: paymentProvider?.name || '',
            description: paymentProvider?.description || '',
            imageUrl: paymentProvider?.imageUrl || ''
          };
        }),
        propertyPaymentMethodSetting: paymentMethodSetting
          ? {
              id: paymentMethodSetting.id,
              globalPaymentMethodId: paymentMethodSetting.globalPaymentMethodId,
              globalPaymentProviderId: paymentMethodSetting.globalPaymentProviderId,
              metadata: {
                value: paymentMethodSetting.metadata?.value || '',
                metadata: paymentMethodSetting.metadata?.metadata || {}
              },
              status: paymentMethodSetting.status
            }
          : null
      };
      return newItem;
    });
    return mappedData;
  }

  async activateHotelPaymentMethod(
    input: ActivateHotelPaymentMethodInputDto
  ): Promise<PropertyPaymentMethodSettingDto> {
    // Get hotel ID from property code or use provided hotelId
    let hotelId: string;
    if (input.propertyCode) {
      const hotel = await this.hotelsService.getHotelInformation({
        hotelCode: input.propertyCode
      });
      if (!hotel) {
        throw new ValidationException('Hotel not found');
      }
      hotelId = hotel.id;
    } else if (input.hotelId) {
      hotelId = input.hotelId;
    } else {
      throw new ValidationException('Hotel ID or property code is required');
    }

    // Prepare payment method setting input
    const propertyPaymentMethodSettingInput: any = {
      hotelId: hotelId,
      metadata: input.metadata,
      status: PaymentMethodStatusEnum.ACTIVE
    };

    if (input.globalPaymentProviderId) {
      // Get payment provider
      const paymentProviderList =
        await this.globalPaymentProviderRepository.getGlobalPaymentProviderList({
          ids: [input.globalPaymentProviderId]
        });

      if (!paymentProviderList || paymentProviderList.length === 0) {
        throw new ValidationException('Payment provider not found');
      }

      const globalPaymentProvider = paymentProviderList[0];
      propertyPaymentMethodSettingInput.globalPaymentProviderId = globalPaymentProvider.id;

      // Get mapping hotel/connector
      let mappingHotel: any = null;
      try {
        mappingHotel = await this.mappingPmsHotelRepository.getMappingPmsHotel({ hotelId });
      } catch (error) {
        // Mapping hotel might not exist, continue
      }

      // Handle provider-specific logic
      switch (globalPaymentProvider.code) {
        case GlobalPaymentProviderCodeEnum.OPI:
          if (mappingHotel?.connector) {
            const connector = mappingHotel.connector;
            if (connector.connectorType !== ConnectorTypeEnum.OHIP) {
              throw new BadRequestException('This payment method only supports Opera PMS');
            }

            // Validate metadata for OPI
            if (
              !propertyPaymentMethodSettingInput.metadata?.metadata ||
              !propertyPaymentMethodSettingInput.metadata.metadata.method
            ) {
              throw new BadRequestException('OPI - Invalid metadata');
            }

            // Check for hotel interface (Eft)
            // Note: This would require hotel interface remote service - placeholder for now
            const hasEftInterface = await this.checkOpiEftInterface(connector);

            if (!hasEftInterface) {
              if (propertyPaymentMethodSettingInput.metadata.metadata.method === 'NO_OPI') {
                // Use default merchant ID from config
                const merchantId = this.configService.get<string>('OPI_MERCHANT_ID') || '';
                propertyPaymentMethodSettingInput.metadata.metadata.merchantId = merchantId;
                propertyPaymentMethodSettingInput.status = PaymentMethodStatusEnum.ACTIVE;
              } else {
                throw new BadRequestException('This payment method has not been supported yet');
              }
            }
          } else {
            throw new BadRequestException('This payment method only supports Opera PMS');
          }
          break;

        case GlobalPaymentProviderCodeEnum.GAUVENDI_PAY:
          propertyPaymentMethodSettingInput.status = PaymentMethodStatusEnum.ACTIVE;
          break;

        case GlobalPaymentProviderCodeEnum.MEWS_PAYMENT:
          if (mappingHotel?.connector) {
            const connector = mappingHotel.connector;
            const refreshToken = connector.refreshToken;

            if (refreshToken) {
              // Get Mews configuration through PmsService
              const configuration = await this.pmsService.authorizeConnector({
                connectorType: ConnectorTypeEnum.MEWS,
                hotelCode: '', // Not needed for getting config
                refreshToken: refreshToken
              });

              if (configuration && (configuration as any).PaymentCardStorage?.PublicKey) {
                const publicKey = (configuration as any).PaymentCardStorage.PublicKey;
                propertyPaymentMethodSettingInput.metadata = {
                  value: null,
                  metadata: {
                    subMerchantId: publicKey
                  }
                };
              }
            }
          }
          break;

        case GlobalPaymentProviderCodeEnum.PAYPAL:
          propertyPaymentMethodSettingInput.status = PaymentMethodStatusEnum.PENDING;
          await this.handlePaypalOnboarding(input, propertyPaymentMethodSettingInput);
          break;

        case GlobalPaymentProviderCodeEnum.ADYEN:
          const verificationResponse = await this.adyenVerifyIntegration(
            propertyPaymentMethodSettingInput
          );
          if (verificationResponse.error) {
            throw new BadRequestException(
              verificationResponse.message || 'Adyen verification failed'
            );
          }

          const hmacKey = verificationResponse.hmacKey;
          if (hmacKey && propertyPaymentMethodSettingInput.metadata?.metadata) {
            propertyPaymentMethodSettingInput.metadata.metadata.hmacKey = hmacKey;
          }
          break;
      }

      if (input.globalPaymentMethodId) {
        propertyPaymentMethodSettingInput.globalPaymentMethodId = input.globalPaymentMethodId;
      }
    } else if (input.globalPaymentMethodId) {
      // Get payment method if provider not provided
      const globalPaymentMethod = await this.globalPaymentMethodRepository.findOne({
        id: input.globalPaymentMethodId
      });

      if (!globalPaymentMethod) {
        throw new NotFoundException('Global payment method not found');
      }

      propertyPaymentMethodSettingInput.globalPaymentMethodId = input.globalPaymentMethodId;

      // Handle PayPal payment method
      if (globalPaymentMethod.code === SupportedPaymentMethodCodes.PAYPAL) {
        propertyPaymentMethodSettingInput.status = PaymentMethodStatusEnum.PENDING;
        await this.handlePaypalOnboarding(input, propertyPaymentMethodSettingInput);
      }
    } else {
      throw new ValidationException(
        'Either globalPaymentProviderId or globalPaymentMethodId is required'
      );
    }

    // Create or update payment method setting
    return await this.createOrUpdatePropertyPaymentMethodSetting(propertyPaymentMethodSettingInput);
  }

  private async checkOpiEftInterface(connector: any): Promise<boolean> {
    // Placeholder: This would call hotel interface remote service
    // to check for Eft interface availability
    // For now, return false to trigger NO_OPI logic
    return false;
  }

  private async handlePaypalOnboarding(
    input: ActivateHotelPaymentMethodInputDto,
    propertyPaymentMethodSettingInput: any
  ): Promise<void> {
    try {
      // Extract merchant ID from input metadata
      const merchantId = input.metadata?.metadata?.merchant as string | undefined;

      if (!merchantId) {
        // If no merchant ID, set default flags and return
        if (propertyPaymentMethodSettingInput.metadata?.metadata) {
          propertyPaymentMethodSettingInput.metadata.metadata.isPrimaryEmailConfirmed = false;
          propertyPaymentMethodSettingInput.metadata.metadata.isPaymentReceivable = false;
        }
        return;
      }

      // Call payment interface service to get PayPal merchant onboarding status
      const paymentInterfaceUrl = this.configService.get<string>(
        ENVIRONMENT.REMOTE_SERVICE_ENDPOINT_ITF_PAYMENT
      );

      if (!paymentInterfaceUrl) {
        // If service URL not configured, set default flags
        if (propertyPaymentMethodSettingInput.metadata?.metadata) {
          propertyPaymentMethodSettingInput.metadata.metadata.isPrimaryEmailConfirmed = false;
          propertyPaymentMethodSettingInput.metadata.metadata.isPaymentReceivable = false;
        }
        return;
      }

      const response = await firstValueFrom(
        this.httpService.get<{ data: PayPalMerchantOnboardingStatusDto }>(
          `${paymentInterfaceUrl}/paypal/merchants/${merchantId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            timeout: 30000
          }
        )
      );

      const onboardingStatus = response.data?.data;

      // Ensure metadata object exists
      if (!propertyPaymentMethodSettingInput.metadata) {
        propertyPaymentMethodSettingInput.metadata = {
          value: null,
          metadata: {}
        };
      }
      if (!propertyPaymentMethodSettingInput.metadata.metadata) {
        propertyPaymentMethodSettingInput.metadata.metadata = {};
      }

      const metadata = propertyPaymentMethodSettingInput.metadata.metadata;

      if (onboardingStatus) {
        // Extract boolean values (handle null/undefined)
        const isPrimaryEmailConfirmed =
          onboardingStatus['primary_email_confirmed'] !== null &&
          onboardingStatus['primary_email_confirmed'] !== undefined &&
          onboardingStatus['primary_email_confirmed'] === true;

        const isPaymentReceivable =
          onboardingStatus['payments_receivable'] !== null &&
          onboardingStatus['payments_receivable'] !== undefined &&
          onboardingStatus['payments_receivable'] === true;

        metadata.isPrimaryEmailConfirmed = isPrimaryEmailConfirmed;
        metadata.isPaymentReceivable = isPaymentReceivable;

        // Update metadata in the input object
        propertyPaymentMethodSettingInput.metadata.metadata = metadata;

        // Check if both conditions are met and OAuth integrations exist
        const hasOauthIntegrations =
          onboardingStatus['oauth_integrations'] &&
          Array.isArray(onboardingStatus['oauth_integrations']) &&
          onboardingStatus['oauth_integrations'].length > 0;

        if (isPrimaryEmailConfirmed && isPaymentReceivable && hasOauthIntegrations) {
          propertyPaymentMethodSettingInput.status = PaymentMethodStatusEnum.ACTIVE;
        }
      } else {
        // If onboarding status is null/undefined, set flags to false
        metadata.isPrimaryEmailConfirmed = false;
        metadata.isPaymentReceivable = false;
        propertyPaymentMethodSettingInput.metadata.metadata = metadata;
      }
    } catch (error: any) {
      // Handle errors gracefully - set default flags on error
      if (propertyPaymentMethodSettingInput.metadata?.metadata) {
        propertyPaymentMethodSettingInput.metadata.metadata.isPrimaryEmailConfirmed = false;
        propertyPaymentMethodSettingInput.metadata.metadata.isPaymentReceivable = false;
      }
      // Log error but don't throw - allow the process to continue
      console.error('Error handling PayPal onboarding:', error.message || error);
    }
  }

  /**
   * This will call interface API to create webhook to listen for Adyen events.
   * If input credentials are correct, the webhook should be created successfully and hmacKey should be returned
   */
  private async adyenVerifyIntegration(propertyPaymentMethodSettingInput: any): Promise<{
    error: boolean;
    message?: string;
    hmacKey?: string;
  }> {
    try {
      const globalPaymentMethodId = propertyPaymentMethodSettingInput.globalPaymentMethodId;
      const globalPaymentProviderId = propertyPaymentMethodSettingInput.globalPaymentProviderId;
      const metadata = propertyPaymentMethodSettingInput.metadata?.metadata || {};

      const merchantAccount = metadata.merchantAccount as string | undefined;
      const apiKey = metadata.apiKey as string | undefined;
      const clientKey = metadata.clientKey as string | undefined;
      const urlPrefix = metadata.urlPrefix as string | undefined;

      // Validate required fields
      const isValid =
        merchantAccount &&
        merchantAccount.trim().length > 0 &&
        apiKey &&
        apiKey.trim().length > 0 &&
        clientKey &&
        clientKey.trim().length > 0 &&
        urlPrefix &&
        urlPrefix.trim().length > 0;

      if (!isValid) {
        return {
          error: true,
          message: 'ADYEN_CREDENTIALS_INVALID'
        };
      }

      // Check for duplicate merchant account
      const isDuplicated = await this.isAdyenMerchantAccountDuplicated(
        merchantAccount!,
        globalPaymentMethodId,
        globalPaymentProviderId
      );

      if (isDuplicated) {
        return {
          error: true,
          message: 'ADYEN_MERCHANT_ACCOUNT_DUPLICATED'
        };
      }

      // Call payment interface service to verify integration
      const paymentInterfaceUrl = this.configService.get<string>(
        ENVIRONMENT.REMOTE_SERVICE_ENDPOINT_ITF_PAYMENT
      );

      if (!paymentInterfaceUrl) {
        return {
          error: true,
          message: 'Payment interface service URL not configured'
        };
      }

      const verifyRequest = {
        merchantAccount: merchantAccount,
        apiKey: apiKey
      };

      let response;
      try {
        response = await firstValueFrom(
          this.httpService.post<{ statusCode?: string; data?: PaymentOnboardingDto }>(
            `${paymentInterfaceUrl}/adyen/verify-integration`,
            verifyRequest,
            {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
              },
              timeout: 30000,
              validateStatus: () => true // Don't throw on any status code
            }
          )
        );
      } catch (error: any) {
        return {
          error: true,
          message: 'INTERFACE_ERROR'
        };
      }

      // Check response
      if (!response || !response.data || !response.data.statusCode) {
        return {
          error: true,
          message: 'INTERFACE_ERROR'
        };
      }

      const statusCode = parseInt(response.data.statusCode, 10);

      // Handle 403 Forbidden
      if (statusCode === 403) {
        return {
          error: true,
          message: 'ADYEN_CREDENTIALS_PERMISSION_DENIED'
        };
      }

      // Handle 5xx server errors
      if (statusCode >= 500 && statusCode < 600) {
        return {
          error: true,
          message: 'INTERFACE_SERVER_ERROR'
        };
      }

      // Extract HMAC key from response
      const hmacKey = response.data?.data?.hmacKey;

      if (hmacKey && hmacKey.trim().length > 0) {
        return {
          error: false,
          hmacKey: hmacKey
        };
      }

      return {
        error: true,
        message: 'ADYEN_CANNOT_GENERATE_HMAC_KEY',
        hmacKey: hmacKey || undefined
      };
    } catch (error: any) {
      console.error('[adyenVerifyIntegration] has error occurred', error);
      return {
        error: true,
        message: 'ADYEN_VERIFY_INTEGRATION_FAILED'
      };
    }
  }

  private async isAdyenMerchantAccountDuplicated(
    merchantAccount: string,
    globalPaymentMethodId: string | undefined,
    globalPaymentProviderId: string | undefined
  ): Promise<boolean> {
    try {
      if (!globalPaymentMethodId || !globalPaymentProviderId) {
        return false;
      }

      // Get all payment method settings with the same provider and method
      const allSettings =
        await this.hotelPaymentMethodSettingRepository.getHotelPaymentMethodSettings({
          paymentMethodIds: [globalPaymentMethodId]
        });

      // Filter by provider ID, ACTIVE status, and check for duplicate merchant account
      const duplicateFound = allSettings.some((setting) => {
        // Check if it's the same provider
        if (setting.globalPaymentProviderId !== globalPaymentProviderId) {
          return false;
        }

        // Check if status is ACTIVE
        if (setting.status !== PaymentMethodStatusEnum.ACTIVE) {
          return false;
        }

        // Check if metadata exists and has merchantAccount
        if (!setting.metadata?.metadata || typeof setting.metadata.metadata !== 'object') {
          return false;
        }

        const existingMerchantAccount = setting.metadata.metadata.merchantAccount;
        return existingMerchantAccount && existingMerchantAccount === merchantAccount;
      });

      return duplicateFound;
    } catch (error: any) {
      console.error('[isAdyenMerchantAccountDuplicated] has error occurred', error);
      return false;
    }
  }

  private async createOrUpdatePropertyPaymentMethodSetting(
    input: any
  ): Promise<PropertyPaymentMethodSettingDto> {
    // Find existing setting
    const existingSetting =
      await this.hotelPaymentMethodSettingRepository.getHotelPaymentMethodSetting({
        hotelId: input.hotelId,
        ...(input.globalPaymentProviderId && {
          globalPaymentProviderId: input.globalPaymentProviderId
        }),
        ...(input.globalPaymentMethodId && { globalPaymentMethodId: input.globalPaymentMethodId })
      });

    // get global payment provider
    const paymentProviderList =
      await this.globalPaymentProviderRepository.getGlobalPaymentProviderList({
        ids: [input.globalPaymentProviderId]
      });

    const globalPaymentProvider = paymentProviderList[0];

    let savedSetting: HotelPaymentMethodSetting;

    if (existingSetting) {
      // Update existing
      existingSetting.metadata =
        // for gauvendi pay, we need to use the existing metadata
        globalPaymentProvider?.code === GlobalPaymentProviderCodeEnum.GAUVENDI_PAY
          ? {
              metadata: {
                ...existingSetting?.metadata?.metadata
              }
            }
          : input.metadata;
      existingSetting.status = input.status;
      if (input.globalPaymentProviderId) {
        existingSetting.globalPaymentProviderId = input.globalPaymentProviderId;
      }
      if (input.globalPaymentMethodId) {
        existingSetting.globalPaymentMethodId = input.globalPaymentMethodId;
      }
      savedSetting = await this.hotelPaymentMethodSettingRepository.save(existingSetting);
    } else {
      // Create new
      const newSetting = await this.hotelPaymentMethodSettingRepository.create({
        hotelId: input.hotelId,
        globalPaymentProviderId: input.globalPaymentProviderId,
        globalPaymentMethodId: input.globalPaymentMethodId,
        status: input.status,
        metadata: input.metadata
      });
      savedSetting = await this.hotelPaymentMethodSettingRepository.save(newSetting);
    }

    return {
      id: savedSetting.id,
      globalPaymentMethodId: savedSetting.globalPaymentMethodId,
      globalPaymentProviderId: savedSetting.globalPaymentProviderId,
      metadata: {
        value: savedSetting.metadata?.value || null,
        metadata: savedSetting.metadata?.metadata || {}
      },
      status: savedSetting.status
    };
  }

  async deactivateHotelPaymentMethod(input: DeactivateHotelPaymentMethodInputDto) {
    const hotelPaymentMethodSetting =
      await this.hotelPaymentMethodSettingRepository.getHotelPaymentMethodSetting({
        hotelId: input.hotelId,
        id: input.hotelPaymentMethodSettingId
      });

    if (!hotelPaymentMethodSetting) {
      throw new NotFoundException('Hotel payment method setting not found');
    }

    const globalPaymentMethod = await this.globalPaymentMethodRepository.findOne({
      id: hotelPaymentMethodSetting?.globalPaymentMethodId
    });

    if (!globalPaymentMethod) {
      throw new NotFoundException('Global payment method not found');
    }

    const hotelPaymentTerm = await this.hotelPaymentTermRepository.findAll({
      hotelId: input.hotelId,
      supportedPaymentMethodCodes: [globalPaymentMethod.code]
    });

    if (hotelPaymentTerm.length > 0) {
      throw new BadRequestException('EXISTED_PAYMENT_METHOD_IN_PROPERTY_PAYMENT_TERM');
    }

    const ratePlanPaymentTermSettings = await this.ratePlanPaymentTermSettingRepository.findAll({
      hotelId: input.hotelId,
      supportedPaymentMethodCodes: [globalPaymentMethod.code]
    });

    if (ratePlanPaymentTermSettings.length > 0) {
      throw new BadRequestException('EXISTED_PAYMENT_METHOD_IN_SALES_PLAN_PAYMENT_TERM');
    }

    hotelPaymentMethodSetting.status = PaymentMethodStatusEnum.INACTIVE;
    await this.hotelPaymentMethodSettingRepository.save(hotelPaymentMethodSetting);
    return true;
  }

  async generatePaymentOnboardingUrl(
    input: GeneratePaymentOnboardingUrlInputDto
  ): Promise<PaymentOnboardingDto> {
    const { hotelId, paymentProviderCode, accountType, countryCode, returnUrl, refreshUrl } = input;

    // Get hotel with country expand
    const hotel = await this.hotelsService.getHotelInformation({
      hotelId: hotelId,
      expand: ['hotelConfiguration']
    });

    if (!hotel) {
      throw new ValidationException('Property not found');
    }

    // Stripe: Account ID / PayPal: Merchant ID
    let accountId: string | null = null;

    let gauvendiPay: GlobalPaymentProvider | null = null;
    let guaranteeWithCreditCard: GlobalPaymentMethod | null = null;

    if (paymentProviderCode === GlobalPaymentProviderCodeEnum.GAUVENDI_PAY) {
      gauvendiPay = await this.globalPaymentProviderRepository.getGlobalPaymentProvider({
        code: paymentProviderCode
      });
      guaranteeWithCreditCard = await this.globalPaymentMethodRepository.getGlobalPaymentMethod({
        code: SupportedPaymentMethodCodes.GUAWCC
      });

      if (!gauvendiPay || !guaranteeWithCreditCard) {
        throw new ValidationException('Payment provider or payment method not found');
      }

      // Get payment method settings with PENDING or ACTIVE status
      const propertyPaymentMethodSettingList =
        await this.hotelPaymentMethodSettingRepository.getHotelPaymentMethodSettings({
          hotelId: hotelId,
          paymentMethodIds: [guaranteeWithCreditCard.id]
        });

      // Filter for settings with PENDING or ACTIVE status
      const filteredSettings = propertyPaymentMethodSettingList.filter(
        (setting) =>
          gauvendiPay &&
          setting.globalPaymentProviderId === gauvendiPay.id &&
          (setting.status === PaymentMethodStatusEnum.PENDING ||
            setting.status === PaymentMethodStatusEnum.ACTIVE)
      );

      if (filteredSettings.length > 0) {
        const propertyPaymentMethodSetting = filteredSettings[0];

        if (propertyPaymentMethodSetting.status === PaymentMethodStatusEnum.ACTIVE) {
          throw new ValidationException('Payment provider already connected');
        } else {
          // Extract accountId from metadata
          if (
            propertyPaymentMethodSetting.metadata?.metadata &&
            propertyPaymentMethodSetting.metadata.metadata.platformBackendOriginKey
          ) {
            accountId = propertyPaymentMethodSetting.metadata.metadata
              .platformBackendOriginKey as string;
          }
        }
      }
    } else {
      gauvendiPay = null;
      guaranteeWithCreditCard = null;
    }

    // Prepare input for payment interface service
    const emailAddress = Array.isArray(hotel.emailAddressList)
      ? hotel.emailAddressList[0]
      : hotel.emailAddressList || hotel.senderEmail || '';

    const paymentInput = {
      ...input,
      propertyId: hotel.id,
      emailAddress: emailAddress,
      accountId: accountId || undefined,
      accountType: this.isStripeAccountTypeSupported(accountType) ? accountType : 'standard',
      countryCode: countryCode || hotel.country?.code || '',
      trackingId:
        paymentProviderCode === GlobalPaymentProviderCodeEnum.PAYPAL ? uuidv4() : undefined
    };

    // Call payment interface service
    let paymentOnboardingDto: PaymentOnboardingDto | null = null;

    switch (paymentProviderCode) {
      case GlobalPaymentProviderCodeEnum.GAUVENDI_PAY:
        paymentOnboardingDto = await this.stripeGenerateOnboardingLink(paymentInput);
        break;
      case GlobalPaymentProviderCodeEnum.PAYPAL:
        paymentOnboardingDto = await this.paypalGenerateOnboardingLink(paymentInput);
        break;
      default:
        throw new ValidationException('Unsupported payment provider');
    }

    if (!paymentOnboardingDto) {
      if (
        paymentProviderCode === GlobalPaymentProviderCodeEnum.GAUVENDI_PAY ||
        paymentProviderCode === GlobalPaymentProviderCodeEnum.PAYPAL
      ) {
        throw new ValidationException('Unable to generate onboarding link');
      }
      throw new ValidationException('Unsupported payment provider');
    }

    // Handle response based on payment provider
    switch (paymentProviderCode) {
      case GlobalPaymentProviderCodeEnum.GAUVENDI_PAY:
        if (paymentOnboardingDto.link) {
          const finalAccountId = paymentOnboardingDto?.['account_id'] || accountId;

          if (gauvendiPay && guaranteeWithCreditCard) {
            const metadataWrapper = this.generateMetadata(
              finalAccountId,
              paymentOnboardingDto.link
            );

            // Find existing setting or create new one
            const existingSetting =
              await this.hotelPaymentMethodSettingRepository.getHotelPaymentMethodSetting({
                hotelId: hotel.id,
                globalPaymentProviderId: gauvendiPay.id,
                globalPaymentMethodId: guaranteeWithCreditCard.id
              });

            if (existingSetting) {
              existingSetting.metadata = metadataWrapper;
              existingSetting.status = PaymentMethodStatusEnum.PENDING;
              await this.hotelPaymentMethodSettingRepository.save(existingSetting);
            } else {
              const newSetting = await this.hotelPaymentMethodSettingRepository.create({
                hotelId: hotel.id,
                globalPaymentProviderId: gauvendiPay.id,
                globalPaymentMethodId: guaranteeWithCreditCard.id,
                status: PaymentMethodStatusEnum.PENDING,
                metadata: metadataWrapper
              });
              await this.hotelPaymentMethodSettingRepository.save(newSetting);
            }
          }

          return paymentOnboardingDto;
        } else {
          throw new ValidationException('Unable to generate onboarding link');
        }
      case GlobalPaymentProviderCodeEnum.PAYPAL:
        if (paymentOnboardingDto.href) {
          paymentOnboardingDto.link = paymentOnboardingDto.href;
          return paymentOnboardingDto;
        } else {
          throw new ValidationException('Unable to generate onboarding link');
        }
      default:
        throw new ValidationException('Unsupported payment provider');
    }
  }

  private isStripeAccountTypeSupported(accountType: string): boolean {
    return accountType === 'standard' || accountType === 'advanced';
  }

  private generateMetadata(
    accountId: string | null | undefined,
    link: string
  ): { metadata: Record<string, any> } {
    const metadata: Record<string, any> = {};

    if (accountId) {
      metadata.platformBackendOriginKey = accountId;
      metadata.bookingEngineOriginKey = accountId;
    }

    metadata.feeFixedAmount = 0.3;
    metadata.feePercentage = 0.0025;
    metadata.publicKey = this.configService.get<string>(ENVIRONMENT.STRIPE_PUBLIC_KEY);
    metadata.url = link;

    return {
      metadata
    };
  }

  private async stripeGenerateOnboardingLink(input: any): Promise<PaymentOnboardingDto> {
    const paymentInterfaceUrl = this.configService.get<string>(
      ENVIRONMENT.REMOTE_SERVICE_ENDPOINT_ITF_PAYMENT
    );

    if (!paymentInterfaceUrl) {
      throw new ValidationException('Payment interface service URL not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ data: PaymentOnboardingDto }>(
          `${paymentInterfaceUrl}/stripe/generate-onboarding-link`,
          input,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            timeout: 30000
          }
        )
      );

      const responseData = response.data;
      if (responseData?.data) {
        return responseData.data;
      }
      if (responseData && 'accountId' in responseData) {
        return responseData as unknown as PaymentOnboardingDto;
      }
      throw new ValidationException('Invalid response from payment interface service');
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to generate Stripe onboarding link: ${error.message || 'Unknown error'}`
      );
    }
  }

  private async paypalGenerateOnboardingLink(input: any): Promise<PaymentOnboardingDto> {
    const paymentInterfaceUrl = this.configService.get<string>(
      ENVIRONMENT.REMOTE_SERVICE_ENDPOINT_ITF_PAYMENT
    );

    if (!paymentInterfaceUrl) {
      throw new ValidationException('Payment interface service URL not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ data: PaymentOnboardingDto }>(
          `${paymentInterfaceUrl}/paypal/generate-onboarding-link`,
          input,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            timeout: 30000
          }
        )
      );

      const responseData = response.data;
      if (responseData?.data) {
        return responseData.data;
      }
      if (responseData && 'accountId' in responseData) {
        return responseData as unknown as PaymentOnboardingDto;
      }
      throw new ValidationException('Invalid response from payment interface service');
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to generate PayPal onboarding link: ${error.message || 'Unknown error'}`
      );
    }
  }
}
