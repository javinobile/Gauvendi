import { IsNotEmpty, IsString } from "class-validator";

export class HotelOperationsQueryDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}