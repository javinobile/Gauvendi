import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsObject } from 'class-validator';

export class ResponseDto<T> {
  @IsNumber()
  @ApiProperty({
    description: 'Status code of response',
  })
  statusCode: number;

  @IsString()
  @ApiProperty({
    description: 'Message of response',
  })
  message: string;

  @IsObject()
  @ApiProperty({
    description: 'Result data',
  })
  data: T;
}
