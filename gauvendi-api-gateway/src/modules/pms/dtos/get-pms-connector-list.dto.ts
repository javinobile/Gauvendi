import { ConnectorTypeEnum } from "@src/core/enums/common.enum";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class GetPmsConnectorListDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;
}

export class GetPmsRoomListDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;
}

export class GetPmsHotelListDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}

export class CreateMappingHotelDto {
  @IsEnum(ConnectorTypeEnum)
  @IsNotEmpty()
  connectorType: ConnectorTypeEnum;
  
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsString()
  @IsNotEmpty()
  mappingHotelCode: string;
}


export class DeauthorizeConnectorDto {
  @IsEnum(ConnectorTypeEnum)
  @IsNotEmpty()
  connectorType: ConnectorTypeEnum;
  
  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}