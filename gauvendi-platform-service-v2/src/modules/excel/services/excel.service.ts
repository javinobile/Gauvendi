import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import {
  ExcelConfig,
  ExcelExportOptions,
  ExcelImportOptions
} from '../interfaces/excel-config.interface';

/**
 * Excel Service
 * 
 * Core service để xử lý Excel operations
 * Cung cấp các utility methods cho import/export Excel
 * 
 * @example
 * ```typescript
 * const buffer = await excelService.exportToExcel(data, options);
 * const rows = await excelService.parseExcelFile(file);
 * ```
 */
@Injectable()
export class ExcelService {
  private readonly config: ExcelConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.xlsx', '.xls'],
    batchSize: 100,
    templatePath: './templates',
    defaultDateFormat: 'dd/mm/yyyy',
    enableStreaming: true,
    streamingThreshold: 5000,
  };

  /**
   * Parse Excel file và trả về array of objects
   * 
   * @param file - Uploaded file
   * @param options - Import options
   * @returns Array of parsed data
   * @throws {BadRequestException} If file is invalid
   */
  async parseExcelFile(
    file: Express.Multer.File,
    options?: ExcelImportOptions,
  ): Promise<any[]> {
    this.validateFile(file);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);

    const worksheetIndex = options?.worksheet || 0;
    const worksheet = typeof worksheetIndex === 'number'
      ? workbook.worksheets[worksheetIndex]
      : workbook.getWorksheet(worksheetIndex);

    if (!worksheet) {
      throw new BadRequestException('Worksheet not found');
    }

    const headerRow = options?.headerRow || 1;
    const dataStartRow = options?.dataStartRow || 2;
    const skipEmptyRows = options?.skipEmptyRows ?? true;

    // Get headers
    const headers: string[] = [];
    const headerRowData = worksheet.getRow(headerRow);
    headerRowData.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value?.toString() || `Column${colNumber}`;
    });

    // Parse data rows
    const data: any[] = [];
    const maxRow = options?.maxRows 
      ? Math.min(dataStartRow + options.maxRows, worksheet.rowCount)
      : worksheet.rowCount;

    for (let rowNumber = dataStartRow; rowNumber <= maxRow; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      
      if (skipEmptyRows && this.isEmptyRow(row)) {
        continue;
      }

      const rowData: any = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          rowData[header] = this.getCellValue(cell);
        }
      });

      data.push(rowData);
    }

    return data;
  }

  /**
   * Export data to Excel buffer
   * 
   * @param data - Data to export
   * @param options - Export options
   * @returns Buffer containing Excel file
   */
  async exportToExcel(
    data: any[],
    options: ExcelExportOptions,
  ): Promise<Buffer> {
    if (!data || data.length === 0) {
      throw new BadRequestException('No data to export');
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(options.sheetName || 'Sheet1');

      // Add headers
      if (options.includeHeader !== false) {
        const headers = options.columns.map(col => col.header);
        const headerRow = worksheet.addRow(headers);

        // Apply header styling
        if (options.styling) {
          this.applyHeaderStyling(headerRow, options.styling);
        }
      }

      // Add data rows
      data.forEach((item) => {
        const rowData = options.columns.map((col) => {
          const value = item[col.key];
          return col.formatter ? col.formatter(value) : value;
        });
        worksheet.addRow(rowData);
      });

      // Set column widths
      options.columns.forEach((col, index) => {
        if (col.width) {
          worksheet.getColumn(index + 1).width = col.width;
        }
      });

      // Apply auto-filter
      if (options.autoFilter) {
        worksheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: 1, column: options.columns.length },
        };
      }

      // Freeze panes
      if (options.freezePanes) {
        worksheet.views = [
          {
            state: 'frozen',
            xSplit: options.freezePanes.column,
            ySplit: options.freezePanes.row,
          },
        ];
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate Excel file');
    }
  }

  /**
   * Create read stream for large files
   * 
   * @param filePath - Path to Excel file
   * @returns Stream reader
   */
  createReadStream(filePath: string): ExcelJS.stream.xlsx.WorkbookReader {
    return new ExcelJS.stream.xlsx.WorkbookReader(filePath, {});
  }

  /**
   * Load template workbook
   * 
   * @param templateName - Name of template
   * @returns Workbook instance
   */
  async loadTemplate(templateName: string): Promise<ExcelJS.Workbook> {
    const templatePath = path.join(
      this.config.templatePath,
      `${templateName}.xlsx`,
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    
    return workbook;
  }

  /**
   * Validate uploaded file
   * 
   * @param file - Uploaded file
   * @throws {BadRequestException} If validation fails
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Check file size
    if (file.size > this.config.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds limit (${this.config.maxFileSize / 1024 / 1024}MB)`,
      );
    }

    // Check extension
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (!this.config.allowedExtensions.includes(fileExt)) {
      throw new BadRequestException(
        `Invalid file format. Allowed: ${this.config.allowedExtensions.join(', ')}`,
      );
    }

    // Check MIME type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }
  }

  /**
   * Get cell value with proper type conversion
   * 
   * @param cell - Excel cell
   * @returns Converted value
   */
  private getCellValue(cell: ExcelJS.Cell): any {
    if (!cell.value) {
      return null;
    }

    // Handle formula results
    if (cell.type === ExcelJS.ValueType.Formula) {
      return (cell.value as any).result;
    }

    // Handle dates
    if (cell.type === ExcelJS.ValueType.Date) {
      return cell.value;
    }

    // Handle rich text
    if (cell.type === ExcelJS.ValueType.RichText) {
      return (cell.value as any).richText
        .map((text: any) => text.text)
        .join('');
    }

    return cell.value;
  }

  /**
   * Check if row is empty
   * 
   * @param row - Excel row
   * @returns True if row is empty
   */
  private isEmptyRow(row: ExcelJS.Row): boolean {
    let isEmpty = true;
    
    row.eachCell({ includeEmpty: true }, (cell) => {
      if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
        isEmpty = false;
      }
    });

    return isEmpty;
  }

  /**
   * Apply styling to header row
   * 
   * @param row - Header row
   * @param styling - Styling options
   */
  private applyHeaderStyling(
    row: ExcelJS.Row,
    styling: any,
  ): void {
    row.eachCell((cell) => {
      cell.font = {
        bold: styling.headerBold ?? true,
        size: styling.headerFontSize || 12,
        color: { argb: styling.headerFontColor || 'FFFFFFFF' },
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: styling.headerBackground || 'FF4472C4' },
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      if (styling.borders) {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    });
  }
}

