import { IsNotEmpty, IsString } from "class-validator";

export class GetPmsRatePlanDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;
}
