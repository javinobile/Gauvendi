import { IsNumber, IsString, IsObject } from "class-validator";

export class ResponseDto<T> {
  @IsNumber()
  statusCode: number;

  @IsString()
  message: string;

  @IsObject()
  data: T;
}
