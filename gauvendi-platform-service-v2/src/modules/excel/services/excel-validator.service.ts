import { Injectable } from '@nestjs/common';
import {
    ExcelValidationError,
    ExcelValidationResult,
    ExcelValidationWarning,
} from '../interfaces/excel-config.interface';

/**
 * Excel Validator Service
 * 
 * Service chuyên validate dữ liệu Excel
 * Cung cấp validation rules cho từng entity type
 * 
 * @example
 * ```typescript
 * const result = await validatorService.validateBookings(rows);
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 * ```
 */
@Injectable()
export class ExcelValidatorService {
  /**
   * Validate booking data
   * 
   * @param rows - Array of booking data
   * @returns Validation result
   */
  async validateBookings(rows: any[]): Promise<ExcelValidationResult> {
    const errors: ExcelValidationError[] = [];
    const warnings: ExcelValidationWarning[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because row 1 is header, index starts at 0

      // Validate required fields
      if (!row.guestName || row.guestName.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'guestName',
          message: 'Guest name is required',
          value: row.guestName,
          code: 'REQUIRED_FIELD',
        });
      }

      if (!row.email || row.email.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'email',
          message: 'Email is required',
          value: row.email,
          code: 'REQUIRED_FIELD',
        });
      } else if (!this.isValidEmail(row.email)) {
        errors.push({
          row: rowNumber,
          field: 'email',
          message: 'Invalid email format',
          value: row.email,
          code: 'INVALID_FORMAT',
        });
      }

      if (!row.checkIn) {
        errors.push({
          row: rowNumber,
          field: 'checkIn',
          message: 'Check-in date is required',
          value: row.checkIn,
          code: 'REQUIRED_FIELD',
        });
      }

      if (!row.checkOut) {
        errors.push({
          row: rowNumber,
          field: 'checkOut',
          message: 'Check-out date is required',
          value: row.checkOut,
          code: 'REQUIRED_FIELD',
        });
      }

      // Validate date logic
      if (row.checkIn && row.checkOut) {
        const checkIn = new Date(row.checkIn);
        const checkOut = new Date(row.checkOut);

        if (checkOut <= checkIn) {
          errors.push({
            row: rowNumber,
            field: 'checkOut',
            message: 'Check-out must be after check-in',
            value: row.checkOut,
            code: 'INVALID_DATE_RANGE',
          });
        }

        // Warning for past dates
        if (checkIn < new Date()) {
          warnings.push({
            row: rowNumber,
            field: 'checkIn',
            message: 'Check-in date is in the past',
            code: 'PAST_DATE',
          });
        }
      }

      // Validate phone number
      if (row.phone && !this.isValidPhone(row.phone)) {
        warnings.push({
          row: rowNumber,
          field: 'phone',
          message: 'Phone number format may be invalid',
          code: 'INVALID_FORMAT',
        });
      }

      // Validate amount
      if (row.totalAmount !== undefined) {
        const amount = Number(row.totalAmount);
        if (isNaN(amount) || amount < 0) {
          errors.push({
            row: rowNumber,
            field: 'totalAmount',
            message: 'Total amount must be a positive number',
            value: row.totalAmount,
            code: 'INVALID_NUMBER',
          });
        }
      }
    });

    return {
      isValid: errors.length === 0,
      totalRows: rows.length,
      errorCount: errors.length,
      errors,
      warnings,
    };
  }

  /**
   * Validate rate plan data
   * 
   * @param rows - Array of rate plan data
   * @returns Validation result
   */
  async validateRatePlans(rows: any[]): Promise<ExcelValidationResult> {
    const errors: ExcelValidationError[] = [];
    const warnings: ExcelValidationWarning[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;

      // Validate required fields
      if (!row.date) {
        errors.push({
          row: rowNumber,
          field: 'date',
          message: 'Date is required',
          value: row.date,
          code: 'REQUIRED_FIELD',
        });
      }

      if (!row.roomProduct) {
        errors.push({
          row: rowNumber,
          field: 'roomProduct',
          message: 'Room product is required',
          value: row.roomProduct,
          code: 'REQUIRED_FIELD',
        });
      }

      if (!row.ratePlan) {
        errors.push({
          row: rowNumber,
          field: 'ratePlan',
          message: 'Rate plan is required',
          value: row.ratePlan,
          code: 'REQUIRED_FIELD',
        });
      }

      // Validate rates
      if (row.baseRate !== undefined) {
        const rate = Number(row.baseRate);
        if (isNaN(rate) || rate < 0) {
          errors.push({
            row: rowNumber,
            field: 'baseRate',
            message: 'Base rate must be a positive number',
            value: row.baseRate,
            code: 'INVALID_NUMBER',
          });
        }
      }

      // Warning for very low rates
      if (row.baseRate && Number(row.baseRate) < 100000) {
        warnings.push({
          row: rowNumber,
          field: 'baseRate',
          message: 'Base rate seems unusually low',
          code: 'UNUSUAL_VALUE',
        });
      }

      // Warning for very high rates
      if (row.baseRate && Number(row.baseRate) > 50000000) {
        warnings.push({
          row: rowNumber,
          field: 'baseRate',
          message: 'Base rate seems unusually high',
          code: 'UNUSUAL_VALUE',
        });
      }
    });

    return {
      isValid: errors.length === 0,
      totalRows: rows.length,
      errorCount: errors.length,
      errors,
      warnings,
    };
  }

  /**
   * Generic validation method
   * 
   * @param rows - Data rows to validate
   * @param rules - Validation rules
   * @returns Validation result
   */
  async validate(
    rows: any[],
    rules: Record<string, (value: any, row: any) => string | null>,
  ): Promise<ExcelValidationResult> {
    const errors: ExcelValidationError[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;

      Object.entries(rules).forEach(([field, validationFn]) => {
        const error = validationFn(row[field], row);
        if (error) {
          errors.push({
            row: rowNumber,
            field,
            message: error,
            value: row[field],
          });
        }
      });
    });

    return {
      isValid: errors.length === 0,
      totalRows: rows.length,
      errorCount: errors.length,
      errors,
    };
  }

  /**
   * Validate email format
   * 
   * @param email - Email string
   * @returns True if valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   * 
   * @param phone - Phone number string
   * @returns True if valid
   */
  private isValidPhone(phone: string): boolean {
    // Simple validation for Vietnamese phone numbers
    const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }
}

