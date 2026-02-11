import { Controller, HttpException, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { ExportReservationDto } from '../dtos/export-excel.dto';
import { ExcelExportService } from '../services/excel-export.service';
import { ExcelImportService } from '../services/excel-import.service';
import { ExcelService } from '../services/excel.service';

/**
 * Excel Controller
 *
 * Handle HTTP requests cho Excel operations
 *
 * Endpoints:
 * - POST /excel/import/bookings - Import bookings từ Excel
 * - POST /excel/export/bookings - Export bookings ra Excel
 * - GET /excel/template/:templateName - Download Excel template
 */
@Controller('excel')
export class ExcelController {
  constructor(
    private readonly excelService: ExcelService,
    private readonly excelImportService: ExcelImportService,
    private readonly excelExportService: ExcelExportService
  ) {}

  // /**
  //  * Import bookings from Excel file
  //  *
  //  * @param file - Uploaded Excel file
  //  * @param importDto - Import options
  //  * @returns Import result
  //  *
  //  * @example
  //  * POST /api/excel/import/bookings
  //  * Content-Type: multipart/form-data
  //  *
  //  * file: booking.xlsx
  //  * hotelId: 123
  //  * validate: true
  //  */
  // @Post('import/bookings')
  // @UseInterceptors(FileInterceptor('file'))
  // async importBookings(
  //   @UploadedFile() file: Express.Multer.File,
  //   @Body() importDto: ImportBookingDto,
  // ) {
  //   try {
  //     const result = await this.excelImportService.importBookings(
  //       file,
  //       importDto,
  //     );

  //     return {
  //       success: true,
  //       message: 'Import completed',
  //       data: result,
  //     };
  //   } catch (error) {
  //     throw new HttpException(
  //       {
  //         success: false,
  //         message: error.message || 'Import failed',
  //         error: error.response || error.message,
  //       },
  //       error.status || HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  /**
   * Export bookings to Excel file
   *
   * @param exportDto - Export options
   * @param res - Express response
   *
   * @example
   * POST /api/excel/export/bookings
   * Content-Type: application/json
   *
   * {
   *   "bookingIds": [1, 2, 3],
   *   "format": "detailed",
   *   "columns": ["id", "guestName", "checkIn", "checkOut"]
   * }
   */

  @MessagePattern({ cmd: CMD.EXCEL.EXPORT_RESERVATIONS })
  async exportReservations(@Payload() exportDto: ExportReservationDto) {
    try {
      const buffer = await this.excelExportService.exportReservations(exportDto);
      return buffer;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Export failed',
          error: error.response || error.message
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // /**
  //  * Validate Excel file without importing
  //  *
  //  * @param file - Uploaded Excel file
  //  * @param importDto - Import options
  //  * @returns Validation result
  //  *
  //  * @example
  //  * POST /api/excel/validate
  //  * Content-Type: multipart/form-data
  //  *
  //  * file: data.xlsx
  //  */
  // @Post('validate')
  // @UseInterceptors(FileInterceptor('file'))
  // async validateFile(
  //   @UploadedFile() file: Express.Multer.File,
  //   @Body() importDto: ImportExcelDto,
  // ) {
  //   try {
  //     const importOptions = {
  //       worksheet: importDto.worksheet,
  //       headerRow: importDto.headerRow,
  //       dataStartRow: importDto.dataStartRow,
  //       skipEmptyRows: importDto.skipEmptyRows,
  //       maxRows: importDto.maxRows,
  //     };
  //     const rows = await this.excelService.parseExcelFile(file, importOptions);

  //     // TODO: Implement validation logic based on entity type
  //     const validationResult = {
  //       isValid: true,
  //       totalRows: rows.length,
  //       errorCount: 0,
  //       errors: [],
  //     };

  //     return {
  //       success: true,
  //       message: 'Validation completed',
  //       data: validationResult,
  //     };
  //   } catch (error) {
  //     throw new HttpException(
  //       {
  //         success: false,
  //         message: error.message || 'Validation failed',
  //         error: error.response || error.message,
  //       },
  //       error.status || HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
}
