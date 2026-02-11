import { IsNotEmpty, IsString } from "class-validator";

export class GoogleHotelOnboardingDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;
}

export class GoogleHotelActivateDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;
}

export class GoogleHotelInitializeDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;
}

export class GetGoogleHotelListDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;
}