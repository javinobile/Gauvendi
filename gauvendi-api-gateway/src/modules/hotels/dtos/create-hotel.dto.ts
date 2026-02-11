import { IsNotEmpty, IsString } from "class-validator";

export class CreateHotelDto {
  @IsString()
  @IsNotEmpty()
  countryId: string;

  @IsString()
  @IsNotEmpty()
  languageCode: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
