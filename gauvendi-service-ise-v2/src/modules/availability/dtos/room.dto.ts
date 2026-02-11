import { IsArray, IsOptional, IsString } from 'class-validator';

export class RoomDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rfcIds?: string[];

  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  hotelId?: string;
}
