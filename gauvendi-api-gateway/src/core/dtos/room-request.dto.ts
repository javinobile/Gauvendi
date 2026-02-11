import { IsArray, IsInt, IsOptional } from "class-validator";

export class RoomRequestDto {
  @IsInt()
  @IsOptional()
  adult?: number;

  @IsArray()
  @IsOptional()
  childrenAgeList?: number[];

  @IsInt()
  @IsOptional()
  pets?: number;
}
