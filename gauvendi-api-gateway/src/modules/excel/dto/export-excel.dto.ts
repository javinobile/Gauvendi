import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID
} from 'class-validator';

/**
 * Export Format Type
 */
export enum ExportFormatType {
  BASIC = 'basic',
  DETAILED = 'detailed',
  SUMMARY = 'summary'
}

/**
 * DTO for Excel Export Request
 *
 * Sử dụng cho các API endpoints export Excel
 */
export class ExportExcelDto {
  /**
   * Column keys to export
   * If not provided, export all columns
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];

  /**
   * Export format type
   * Default: detailed
   */
  @IsOptional()
  @IsEnum(ExportFormatType)
  format?: ExportFormatType;

  /**
   * Worksheet name
   * Default: 'Sheet1'
   */
  @IsOptional()
  @IsString()
  sheetName?: string;

  /**
   * Include header row
   * Default: true
   */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeHeader?: boolean;

  /**
   * Apply auto-filter
   * Default: true
   */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  autoFilter?: boolean;

  /**
   * Apply styling
   * Default: true
   */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  applyStyling?: boolean;

  /**
   * Template name to use
   * If provided, use template for export
   */
  @IsOptional()
  @IsString()
  templateName?: string;
}



export class ExportReservationDto extends ExportExcelDto {
  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  bookingChannelList?: string[];

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  bookingFlowList?: string[];

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  bookingSourceList?: string[];

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPmsSync?: boolean;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  promoCodeList?: string[];

  @IsNotEmpty()
  @IsUUID()
  hotelId: string;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  statusList?: string[];

  @IsOptional()
  @IsString()
  text?: string | null;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  reservationNumbers?: string[] | null;

  @IsOptional()
  @IsUUID()
  bookingId?: string | null;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  reservationIds?: string[] | null;

  @IsOptional()
  @IsString()
  bookingNumber?: string | null;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  sort?: string[]; 
}
