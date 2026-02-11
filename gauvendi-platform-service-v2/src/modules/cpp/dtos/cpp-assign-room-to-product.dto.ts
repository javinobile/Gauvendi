import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';
import { ResponseContent } from '@src/core/dtos/common.dto';

export class CppAssignRoomToProductRequestDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsUUID()
  @IsNotEmpty()
  roomProductId: string;

  @IsDateString()
  @IsNotEmpty()
  arrival: string;

  @IsDateString()
  @IsNotEmpty()
  departure: string;
}

export class CppAssignRoomToProductExcludeDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsDateString()
  @IsNotEmpty()
  arrival: string;

  @IsDateString()
  @IsNotEmpty()
  departure: string;
}

export class CppAssignRoomToProductInputDto {
  @IsString()
  @IsNotEmpty()
  propertyCode: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CppAssignRoomToProductRequestDto)
  @ArrayMinSize(1)
  requestList: CppAssignRoomToProductRequestDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CppAssignRoomToProductExcludeDto)
  @IsOptional()
  excludedList?: CppAssignRoomToProductExcludeDto[];
}

export enum CppAssignRoomToProductAssignedStatus {
  ASSIGNED = 'ASSIGNED',
  UNABLE_TO_ASSIGN = 'UNABLE_TO_ASSIGN'
}

export class CppAssignRoomToProductRoomDto {
  assignedRoomId: string;
  assignedRoomNumber: string;
}

export class CppAssignRoomToProductDto {
  id: string;
  roomProductId: string;
  arrival: string;
  departure: string;
  assignedStatus: CppAssignRoomToProductAssignedStatus;
  assignedRoomList: CppAssignRoomToProductRoomDto[];
  message?: string;
}

export class CppAssignRoomToProductResponseDto {
  code?: string;
  message?: string;
  status: string;
  dataList: CppAssignRoomToProductDto[];
}

