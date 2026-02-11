export class MewsRoomProductResponseDto {
  ResourceCategories: MewsRoomProductDto[];
  Cursor?: string;
}

export enum MewsRoomProductType {
  Room = 'Room',
  Dorm = 'Dorm',
  Bed = 'Bed',
  Apartment = 'Apartment'
}

export class MewsRoomProductDto {
  Id: string;
  EnterpriseId: string;
  ServiceId: string;
  IsActive: boolean;
  Type: MewsRoomProductType;
  Classification: string;
  Names: { [key: string]: string };
  ShortNames: { [key: string]: string };
  Descriptions: { [key: string]: string };
  Ordering: number;
  Capacity: number;
  ExtraCapacity: number;
  ExternalIdentifier: string;
  AccountingCategoryId: string;
}

export class BaseMewsBodyDto {
  Client?: string;
  ClientToken?: string;
  AccessToken: string;

  Limitation?: {
    Count?: number;
    Cursor?: string;
  };

  Data?: any;

  ActivityStates?: string[];

  Origin?: string;

  ResourceCategoryIds?: string[]; // room product mapping pms code

  ServiceIds?: string[];
  EnterpriseId?: string;
  EnterpriseIds?: string[];

  RateId?: string;

  Extent?: {
    Inactive?: boolean;
  };

  CollidingUtc?: {
    StartUtc?: string;
    EndUtc?: string;
  };

  CreatedUtc?: {
    StartUtc?: string;
    EndUtc?: string;
  };

  UpdatedUtc?: {
    StartUtc?: string;
    EndUtc?: string;
  };
  LastTimeUnitStartUtc?: string;
  FirstTimeUnitStartUtc?: string;

  ServiceId?: string;

  // use for logic
  StartDate?: string;
  EndDate?: string;
  timezone?: string;
  field?: string; // use for CreatedUtc, UpdatedUtc, CollidingUtc

  Pricing?: 'Gross' | 'Net';
}

export interface MewsRoomProductAvailabilityResponseDto {
  CategoryAvailabilities: MewsRoomProductAvailabilityDto[];
  TimeUnitStartsUtc: string[];
}

export interface MewsRoomProductAvailabilityDto {
  Availabilities: number[];
  Adjustments: number[];
  CategoryId: string;
}

export interface MewsRoomUnitResponseDto {
  Resources: MewsRoomUnitDto[];
  Cursor?: string;
}

export class MewsRoomUnitDto {
  Id: string;
  EnterpriseId: string;
  IsActive: boolean;
  Name: string;
  ParentResourceId: any;
  State: 'Dirty' | 'Clean' | 'Inspected' | 'OutOfService' | 'OutOfOrder';
  Descriptions: { [key: string]: string };
  Data: {
    Discriminator: string;
    Value: {
      FloorNumber: string;
      LocationNotes: string;
    };
  };
  CreatedUtc: string;
  UpdatedUtc: string;
}

export class MewsRoomUnitMaintenanceResponseDto {
  ResourceBlocks: MewsRoomUnitMaintenanceDto[];
  Cursor?: string;
}

export class MewsRoomUnitMaintenanceDto {
  Id: string;
  EnterpriseId: string;
  AssignedResourceId: string;
  IsActive: boolean;
  Type: 'OutOfOrder' | 'InternalUse';
  StartUtc: string;
  EndUtc: string;
  CreatedUtc: string;
  UpdatedUtc: string;
  DeletedUtc: string;
  Name: string;
  Notes: string;
}

export class MewsRestrictionResponseDto {
  Restrictions: MewsRestrictionDto[];
  Cursor?: string;
}

export class MewsRestrictionDto {
  Id: string;
  ServiceId: string;
  ExternalIdentifier: string;
  Origin: string;
  Conditions: {
    // Stay - Guests can't stay within specified dates.
    // Start - Guests can't check in within specified dates.
    // End - Guests can't check out within specified dates.
    Type: 'Stay' | 'Start' | 'End';
    ExactRateId: string;
    BaseRateId: string;
    RateGroupId: string;
    ResourceCategoryId: string;
    ResourceCategoryType: string;
    StartUtc: string;
    EndUtc: string;
    Days: string[];
    Hours: {
      Zero: boolean;
      One: boolean;
      Two: boolean;
      Three: boolean;
      Four: boolean;
      Five: boolean;
      Six: boolean;
      Seven: boolean;
      Eight: boolean;
      Nine: boolean;
      Ten: boolean;
      Eleven: boolean;
      Twelve: boolean;
      Thirteen: boolean;
      Fourteen: boolean;
      Fifteen: boolean;
      Sixteen: boolean;
      Seventeen: boolean;
      Eighteen: boolean;
      Nineteen: boolean;
      Twenty: boolean;
      TwentyOne: boolean;
      TwentyTwo: boolean;
      TwentyThree: boolean;
      TwentyFour: boolean;
    };
  };
  Exceptions: {
    MinAdvance: string; // ISO 8601 duration format (P0M3DT0H0M0S)
    MaxAdvance: string; // ISO 8601 duration format (P0M3DT0H0M0S)
    MinLength: string; // ISO 8601 duration format (P0M3DT0H0M0S)
    MaxLength: string; // ISO 8601 duration format (P0M3DT0H0M0S)
    MinPrice: string; // number (100)
    MaxPrice: string; // number (100)
    MinReservationCount: string; // number (1)
    MaxReservationCount: string; // number (1)
  };
}

export class MewsDeleteRestrictionDto {
  Type: 'Stay' | 'Start' | 'End';
  ExactRateId?: string;
  BaseRateId?: string;
  RateGroupId?: string;
  ResourceCategoryId?: string;
  ResourceCategoryType?: string;
  StartUtc: string;
  EndUtc: string;
  Days: {
    Monday: boolean;
    Tuesday: boolean;
    Wednesday: boolean;
    Thursday: boolean;
    Friday: boolean;
    Saturday: boolean;
    Sunday: boolean;
  };
}

export class MewsRoomProductAssignmentResponseDto {
  ResourceCategoryAssignments: MewsRoomProductAssignmentDto[];
  Cursor?: string;
}

export class MewsRoomProductAssignmentDto {
  Id: string;
  IsActive: boolean;
  ResourceId: string; // room unit id
  CategoryId: string; // room product id
  CreatedUtc: string;
  UpdatedUtc: string;
}

export class MewsRatePlanPricingResponseDto {
  Currency: string;
  DatesUtc: string[];
  TimeUnitStartsUtc: string[];
  BasePrices: number[];
  BaseAmountPrices?: MewsRatePlanPricingAmountPriceDto[];
  CategoryPrices: MewsRatePlanPricingCategoryDto[];
  CategoryAdjustments?: MewsRatePlanPricingCategoryAdjustmentDto[];
  AgeCategoryAdjustments?: MewsRatePlanPricingAgeCategoryAdjustmentDto[];
  RelativeAdjustment?: number;
  AbsoluteAdjustment?: number;
  EmptyUnitAdjustment?: number;
  ExtraUnitAdjustment?: number;
}

export class MewsRatePlanPricingCategoryDto {
  CategoryId: string; // room product mapping pms code
  Prices: number[];
  AmountPrices: MewsRatePlanPricingAmountPriceDto[];
}

export class MewsRatePlanPricingAmountPriceDto {
  Currency: string;
  NetValue: number;
  GrossValue: number;
  TaxValues?: MewsRatePlanPricingTaxValueDto[];
  Breakdown?: MewsRatePlanPricingBreakdownDto;
}

export class MewsRatePlanPricingTaxValueDto {
  Code: string;
  Value: number;
}

export class MewsRatePlanPricingBreakdownDto {
  Items: MewsRatePlanPricingBreakdownItemDto[];
}

export class MewsRatePlanPricingBreakdownItemDto {
  TaxRateCode: string;
  NetValue: number;
  TaxValue: number;
}

export class MewsRatePlanPricingCategoryAdjustmentDto {
  CategoryId: string;
  ParentCategoryId?: string;
  AbsoluteValue: number;
  RelativeValue: number;
}

export class MewsRatePlanPricingAgeCategoryAdjustmentDto {
  AgeCategoryId: string;
  AbsoluteValue: number;
  Type: 'StandardOccupancyAdjustment' | 'ExtraOccupancyAdjustment';
}

export class MewsRatePlanResponseDto {
  Rates: MewsRatePlanRateDto[];
  RateGroups: MewsRatePlanRateGroupDto[];
}

export class MewsRatePlanRateGroupDto {
  Id: string;
  ServiceId: string;
  IsActive: boolean;
  Name: string;
  ExternalIdentifier: string;
}

export class MewsRatePlanRateDto {
  Id: string;
  GroupId: string;
  ServiceId: string;
  BaseRateId: string;
  IsBaseRate: boolean;
  BusinessSegmentId: string;
  IsActive: boolean;
  IsEnabled: boolean;
  IsPublic: boolean;
  IsDefault: boolean;
  Type: string;
  Name: string;
  Names: { [key: string]: string };
  ShortName: string;
  UpdatedUtc: string;
  ExternalNames: { [key: string]: string };
  Description: { [key: string]: string };
  ExternalIdentifier: string;
  Options: { [key: string]: string };
  TaxExemptionReason: string;
  TaxExemptionLegalReference: string;
}

// Configuration API DTOs
export class MewsConfigurationResponseDto {
  NowUtc: string;
  Enterprise: MewsEnterpriseDto;
  Service: MewsConfigurationServiceDto;
  PaymentCardStorage: any;
  IsIdentityDocumentNumberRequired: boolean;
}

export class MewsEnterpriseDto {
  Id: string;
  ExternalIdentifier: string;
  HoldingKey: string;
  ChainId: string;
  ChainName: string;
  CreatedUtc: string;
  UpdatedUtc: string;
  Name: string;
  TimeZoneIdentifier: string;
  LegalEnvironmentCode: string;
  AccommodationEnvironmentCode: string;
  AccountingEnvironmentCode: string;
  TaxEnvironmentCode: string;
  DefaultLanguageCode: string;
  EditableHistoryInterval: string;
  AccountingEditableHistoryInterval: string;
  OperationalEditableHistoryInterval: string;
  BusinessDayClosingOffset: string;
  WebsiteUrl: string;
  Email: string;
  Phone: string;
  LogoImageId: string;
  CoverImageId: string;
  Pricing: 'Gross' | 'Net';
  TaxPrecision: number;
  AddressId: string;
  Address: MewsAddressDto;
  GroupNames: string[];
  Currencies: MewsCurrencyDto[];
  AccountingConfiguration: MewsAccountingConfigurationDto;
  IsPortfolio: boolean;
  Subscription: {
    TaxIdentifier: string;
  };
}

export class MewsAddressDto {
  Id: string;
  Line1: string;
  Line2: string;
  City: string;
  PostalCode: string;
  CountryCode: string;
  CountrySubdivisionCode: string;
  Latitude: number;
  Longitude: number;
}

export class MewsCurrencyDto {
  Currency: string;
  IsDefault: boolean;
  IsEnabled: boolean;
}

export class MewsAccountingConfigurationDto {
  AdditionalTaxIdentifier: string;
  CompanyName: string;
  BankAccountNumber: string;
  BankName: string;
  Iban: string;
  Bic: string;
  SurchargeConfiguration: {
    SurchargeFees: { [key: string]: number };
    SurchargeServiceId: string;
    SurchargeTaxCode: string;
  };
  EnabledExternalPaymentTypes: string[];
  Options: string[];
}

export class MewsServiceDto {
  Id: string;
  EnterpriseId: string;
  IsActive: boolean;
  Name: string;
  Options: {
    BillAsPackage: boolean;
  };
  Data: {
    Discriminator: 'Bookable' | 'Additional';
    Value: {
      // For Bookable services (Accommodation)
      StartOffset?: string;
      EndOffset?: string;
      OccupancyStartOffset?: string;
      OccupancyEndOffset?: string;
      TimeUnitPeriod?: string;
      // For Additional services (Restaurant, etc.)
      Promotions?: {
        BeforeCheckIn: boolean;
        AfterCheckIn: boolean;
        DuringStay: boolean;
        BeforeCheckOut: boolean;
        AfterCheckOut: boolean;
        DuringCheckOut: boolean;
      };
    };
  };
  ExternalIdentifier: string;
  CreatedUtc: string;
  UpdatedUtc: string;
}

// Service DTO for configuration response (different structure)
export class MewsConfigurationServiceDto {
  Id: string;
  EnterpriseId: string;
  IsActive: boolean;
  Name: string;
  Names: { [key: string]: string };
  StartTime: string;
  EndTime: string;
  Options: {
    BillAsPackage: boolean;
  };
  Promotions: {
    BeforeCheckIn: boolean;
    AfterCheckIn: boolean;
    DuringStay: boolean;
    BeforeCheckOut: boolean;
    AfterCheckOut: boolean;
    DuringCheckOut: boolean;
  };
  Type: string;
  Ordering: number;
  Data: any;
  ExternalIdentifier: string;
  CreatedUtc: string;
  UpdatedUtc: string;
}

export class MewsServicesResponseDto {
  Services: MewsServiceDto[];
  Cursor?: string;
}

export class MewsResourcesBodyDto extends BaseMewsBodyDto {
  ResourceIds?: string[];
  Names?: string[];
}

// Taxations API DTOs - Raw Mews Response
export class MewsTaxationsResponseDto {
  Taxations: MewsTaxationDto[];
  TaxRates: MewsTaxRateDto[];
}

export class MewsTaxationDto {
  Code: string;
  Name: string;
  LocalName: string;
}

export class MewsTaxRateDto {
  Code: string;
  TaxationCode: string;
  ValidityInvervalsUtc: {
    StartUtc: string | null;
    EndUtc: string | null;
  }[];
  Strategy: MewsTaxRateStrategyDto;
  Value: MewsTaxRateStrategyValueDto
}

export class MewsTaxRateStrategyDto {
  Discriminator: 'Relative' | 'Dependent' | 'Flat' | 'Absolute';
  Value: MewsTaxRateStrategyValueDto;
}

export class MewsTaxRateStrategyValueDto {
  Value: number;
  CurrencyCode?: string; // Only for Flat strategy
  BaseTaxationCodes?: string[]; // Only for Dependent strategy
}

// Tax Environments API DTOs
export class MewsTaxEnvironmentsResponseDto {
  TaxEnvironments: MewsTaxEnvironmentDto[];
}

export class MewsTaxEnvironmentDto {
  Code: string;
  CountryCode: string;
  TaxationCodes: string[];
  ValidityStartUtc: string | null;
  ValidityEndUtc: string | null;
}

// Product DTOs for MEWS Products API
export class MewsProductResponseDto {
  Products: MewsProductDto[];
  Cursor?: string;
}

export class MewsProductDto {
  Id: string;
  ServiceId: string;
  CategoryId?: string;
  IsActive: boolean;
  IsDefault?: boolean;
  Name: string;
  ExternalName?: string;
  ShortName?: string;
  Description?: string;
  Charging?: string;
  ChargingMode?: string;
  Posting?: any;
  Price?: {
    Currency?: string;
    NetValue?: number;
    GrossValue?: number;
  };
  Pricing?: MewsProductPricingDto;
}

export class MewsProductPricingDto {
  Discriminator?: string; // 'Relative' | 'Dependent' | 'Flat' | 'Absolute'
  Value?: MewsProductValueDto;
}

export class MewsProductValueDto {
  Value?: number;
  Currency?: string;
  Multiplier?: number;
  Target?: string;
}
