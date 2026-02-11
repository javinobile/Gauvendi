import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Filter } from '../../../core/dtos/common.dto';

export class HotelCancellationPolicyFilterDto extends Filter {
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description: 'Hotel code',
    example: 'HTL001'
  })
  hotelCode: string;

  hotelId: string;

  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Set of cancellation policy IDs',
    type: [String],
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012']
  })
  idList?: string[];

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether this is the default cancellation policy',
    example: true
  })
  isDefault?: boolean;
}

export class HotelCancellationPoliciesFilterDto extends Filter {
  hotelId: string;
  codes: string[];
}
