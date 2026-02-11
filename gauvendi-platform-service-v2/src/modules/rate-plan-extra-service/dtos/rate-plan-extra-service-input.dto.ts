import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class ExtraServiceInputDto {
  @ApiProperty({
    description: 'Service ID',
    example: '123e4567-e89b-12d3-a456-426614174002'
  })
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Service type',
    example: 'INCLUDED',
    enum: ['INCLUDED', 'EXTRA', 'MANDATORY']
  })
  @IsOptional()
  type?: string;
}

export class RatePlanExtraServiceInputDto {
  @ApiProperty({
    description: 'Rate plan ID',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsNotEmpty()
  @IsUUID('4')
  ratePlanId: string;

  @ApiProperty({
    description: 'List of extra services to associate with the rate plan',
    type: [ExtraServiceInputDto],
    example: [
      {
        serviceId: '123e4567-e89b-12d3-a456-426614174002',
        type: 'INCLUDED'
      }
    ]
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraServiceInputDto)
  services: ExtraServiceInputDto[];
}
