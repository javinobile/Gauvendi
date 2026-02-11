import { IsOptional, IsString, IsUUID, IsInt } from "class-validator";
import { Transform } from "class-transformer";

export class CppSearchGuestFilterDto {
  @IsString()
  propertyCode: string;

  @IsString()
  @IsOptional()
  query?: string;

  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 0))
  pageIndex?: number = 0;

  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 100))
  pageSize?: number = 100;
}

export class CppSearchGuestDto {
  id: string;
  name: string;
  email: string;
}

