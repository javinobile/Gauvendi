import { IsOptional, IsString } from 'class-validator';

export class ConnectorDto {
  @IsString()
  hotelId: string;

  @IsString()
  @IsOptional()
  connectorType?: string;
}
