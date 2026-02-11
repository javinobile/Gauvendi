import { IsNotEmpty, IsString } from "class-validator";

export class GetImagesDto {
  @IsNotEmpty()
  @IsString()
  public readonly hotelId: string;
}

export class UploadImageDto extends GetImagesDto {}
