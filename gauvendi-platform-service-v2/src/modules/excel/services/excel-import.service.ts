import { Injectable } from '@nestjs/common';
import { ExcelValidatorService } from './excel-validator.service';
import { ExcelService } from './excel.service';

/**
 * Excel Import Service
 *
 * Service chuyên xử lý import operations
 * Implement business logic cho từng loại import
 *
 * @example
 * ```typescript
 * const result = await excelImportService.importBookings(file, options);
 * ```
 */
@Injectable()
export class ExcelImportService {
  constructor(
    private readonly excelService: ExcelService,
    private readonly validatorService: ExcelValidatorService
  ) {}

//   /**
//    * Import bookings from Excel file
//    *
//    * @param file - Uploaded file
//    * @param options - Import options
//    * @returns Import result with statistics
//    * @throws {BadRequestException} If validation fails
//    */
//   async importBookings(
//     file: Express.Multer.File,
//     options: ImportBookingDto
//   ): Promise<ExcelImportResult> {
//     const startTime = Date.now();

//     // Step 1: Parse Excel file
//     const importOptions = {
//       worksheet: options.worksheet,
//       headerRow: options.headerRow,
//       dataStartRow: options.dataStartRow,
//       skipEmptyRows: options.skipEmptyRows,
//       maxRows: options.maxRows
//     };
//     const rows = await this.excelService.parseExcelFile(file, importOptions);

//     if (rows.length === 0) {
//       throw new BadRequestException('Excel file is empty');
//     }

//     // Step 2: Validate data
//     if (options.validate !== false) {
//       const validationResult = await this.validatorService.validateBookings(rows);

//       if (!validationResult.isValid) {
//         if (options.stopOnError) {
//           throw new BadRequestException('Validation failed', {
//             cause: validationResult.errors
//           });
//         }
//       }
//     }

//     // Step 3: Import data
//     const successfulRows: any[] = [];
//     const failedRows: any[] = [];

//     for (const [index, row] of rows.entries()) {
//       try {
//         // TODO: Implement actual booking creation logic
//         // await this.bookingService.create(row);

//         successfulRows.push(row);
//       } catch (error) {
//         failedRows.push({
//           row: index + 1,
//           error: error.message,
//           data: row
//         });

//         if (options.stopOnError) {
//           break;
//         }
//       }
//     }

//     const processingTime = Date.now() - startTime;

//     return {
//       total: rows.length,
//       successful: successfulRows.length,
//       failed: failedRows.length,
//       errors: failedRows,
//       processingTime
//     };
//   }

  //   /**
  //    * Import data with error recovery
  //    * Generic method cho bulk import với error handling
  //    *
  //    * @param file - Uploaded file
  //    * @param options - Import options
  //    * @param processor - Function to process each row
  //    * @returns Import result
  //    */
  //   async importWithErrorRecovery(
  //     file: Express.Multer.File,
  //     options: any,
  //     processor: (row: any) => Promise<void>,
  //   ): Promise<ExcelImportResult> {
  //     const startTime = Date.now();

  //     const rows = await this.excelService.parseExcelFile(file, options);
  //     const successfulRows: any[] = [];
  //     const failedRows: any[] = [];

  //     for (const [index, row] of rows.entries()) {
  //       try {
  //         await processor(row);
  //         successfulRows.push(row);
  //       } catch (error) {
  //         failedRows.push({
  //           row: index + 1,
  //           error: error.message,
  //           data: row,
  //         });

  //         if (options.stopOnError) {
  //           break;
  //         }
  //       }
  //     }

  //     const processingTime = Date.now() - startTime;

  //     return {
  //       total: rows.length,
  //       successful: successfulRows.length,
  //       failed: failedRows.length,
  //       errors: failedRows,
  //       processingTime,
  //     };
  //   }
}
