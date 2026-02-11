import { ApiProperty } from "@nestjs/swagger";
import { PaymentAccountOriginEnum } from "@src/core/enums/common.enum";
import { Transform, Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

export class HotelInformationQueryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  hotelCode: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  expand?: string[];
}

export class HotelsQueryDto {
  @ApiProperty()
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  expand?: string[];
}

export class GetPaymentAccountListQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @ApiProperty()
  @IsEnum(PaymentAccountOriginEnum)
  @IsOptional()
  origin?: PaymentAccountOriginEnum;
}



export class CompleteOnboardingHotelDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => OnboardingMainRfcInput)
  @IsArray()
  mainRfcList?: OnboardingMainRfcInput[];

  @ValidateNested()
  @IsOptional()
  @Type(() => OnboardingRoomInput)
  @IsArray()
  roomList?: OnboardingRoomInput[];

  @ValidateNested()
  @IsOptional()
  @Type(() => MainRfcRoomAssignmentInput)
  @IsArray()
  roomAssignmentList?: MainRfcRoomAssignmentInput[];

  @ValidateNested()
  @IsOptional()
  @Type(() => MainRfcFeatureAssignmentInput)
  @IsArray()
  featureAssignmentList?: MainRfcFeatureAssignmentInput[];
}

export class OnboardingMainRfcInput {
  @IsString()
  @IsNotEmpty()
  code: string; // room product code

  @IsString()
  @IsNotEmpty()
  name: string; // room product name

  @IsString()
  @IsNotEmpty()
  mappingRoomTypeCode: string; // room product pms code
}

export class OnboardingRoomInput {
  @IsString()
  @IsNotEmpty()
  mappingRoomCode: string; // room unit pms code

  @IsString()
  @IsNotEmpty()
  roomNumber: string; // room unit name 
}

export class MainRfcRoomAssignmentInput {
  @IsString()
  @IsNotEmpty()
  mappingRoomCode: string; // room unit pms code

  @IsString()
  @IsNotEmpty()
  rfcCode: string; // room product code

  @IsString()
  @IsOptional()
  roomNumber?: string; // room unit name
}

export class MainRfcFeatureAssignmentInput {
  @IsNumber()
  @IsOptional()
  quantity?: number; // quantity

  @IsString()
  @IsNotEmpty()
  rfcCode: string; // room product code

  @IsString()
  @IsNotEmpty()
  templateFeatureId: string; // template feature id // get from admin feature
}
