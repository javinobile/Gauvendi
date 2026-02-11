import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { CancellationFeeUnitEnum } from 'src/core/entities/hotel-entities/hotel-cancellation-policy.entity';

export class HotelCancellationPolicyInputDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsUUID()
  hotelId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  cancellationType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  hourPrior?: number;

  @IsOptional()
  @IsString()
  displayUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cancellationFeeValue?: number;

  @IsOptional()
  @IsEnum(CancellationFeeUnitEnum)
  cancellationFeeUnit?: CancellationFeeUnitEnum;

  @IsOptional()
  @IsString()
  description?: string;
}
