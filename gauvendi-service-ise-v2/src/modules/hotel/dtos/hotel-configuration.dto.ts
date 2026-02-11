import { IsBoolean, IsString } from 'class-validator';

export class HotelConfigurationDto {
  @IsString()
  hotelId: string;

  @IsString()
  configType: string;

  @IsBoolean()
  softDelete: boolean;
}

export class HotelConfigurationByTypesDto {
  hotelId: string;

  configTypes: string[];

  softDelete: boolean;
}
