import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * DTO for Excel Import Request
 * 
 * Sử dụng cho các API endpoints import Excel
 */
export class ImportExcelDto {
  /**
   * Worksheet index or name to import
   * Default: first worksheet (0)
   */
  @IsOptional()
  @IsString()
  worksheet?: string;

  /**
   * Header row number
   * Default: 1
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  headerRow?: number;

  /**
   * Data start row number
   * Default: 2
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dataStartRow?: number;

  /**
   * Skip empty rows during import
   * Default: true
   */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  skipEmptyRows?: boolean;

  /**
   * Validate data before import
   * Default: true
   */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  validate?: boolean;

  /**
   * Stop on first error
   * Default: false
   */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  stopOnError?: boolean;

  /**
   * Maximum rows to import
   * Default: unlimited
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxRows?: number;
}




