import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { applyDecorators } from '@nestjs/common';

export interface BooleanTransformOptions {
  /**
   * Whether the field is required or optional
   * If true, allows null/undefined values
   * @default false
   */
  allowNull?: boolean;

  /**
   * Custom error message for validation
   */
  message?: string;

  /**
   * Additional string values that should be considered as true
   * @default ['true', '1', 'yes']
   */
  trueValues?: string[];

  /**
   * Additional string values that should be considered as false
   * @default ['false', '0', 'no', '']
   */
  falseValues?: string[];

  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Custom decorator for handling boolean fields from query parameters and form data
 * Combines @Type, @Transform, @IsBoolean, and optionally @IsOptional
 *
 * @param options Configuration options for boolean transformation
 *
 * @example
 * ```typescript
 * @BooleanTransform()
 * isActive: boolean;
 *
 * @BooleanTransform({ allowNull: true })
 * isOptional?: boolean;
 *
 * @BooleanTransform({
 *   trueValues: ['yes', 'y', '1', 'true', 'on'],
 *   falseValues: ['no', 'n', '0', 'false', 'off', ''],
 *   debug: true
 * })
 * customBoolean: boolean;
 * ```
 */
export function BooleanTransform(options: BooleanTransformOptions = {}) {
  const {
    allowNull = false,
    message,
    trueValues = ['true', '1', 'yes'],
    falseValues = ['false', '0', 'no', ''],
    debug = false
  } = options;

  // Create the transformation function
  const transformFn = ({ value, key }: { value: any; key: string }) => {
    if (debug) {
      console.log(`BooleanTransform [${key}]:`, { value, type: typeof value });
    }

    // Handle null/undefined based on allowNull setting
    if (value === undefined || value === null) {
      if (allowNull) {
        return value; // Return null/undefined as-is
      }
      return false; // Convert to false if not allowing null
    }

    if (value === 'null' || value === 'undefined') {
      if (allowNull) {
        return null;
      }

      value = null;
    }

    // Already a boolean - return as-is
    if (typeof value === 'boolean') {
      return value;
    }

    // String conversion (most common case for query parameters)
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();

      // Check true values
      if (trueValues.some((tv) => tv.toLowerCase() === lowerValue)) {
        return true;
      }

      // Check false values
      if (falseValues.some((fv) => fv.toLowerCase() === lowerValue)) {
        return false;
      }

      // If not in predefined lists, use standard logic
      // Empty string = false, non-empty string = true
      return lowerValue.length > 0;
    }

    // Number conversion
    if (typeof value === 'number') {
      return value !== 0;
    }

    // Array conversion (edge case)
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    // Fallback to standard Boolean conversion
    return Boolean(value);
  };

  // Build the decorator array
  const decorators = [
    Type(() => String), // Force string type first to prevent implicit conversion
    Transform(transformFn)
  ];

  // Add validation decorators
  if (allowNull) {
    decorators.push(IsOptional());
  }

  decorators.push(IsBoolean({ message }));

  return applyDecorators(...decorators);
}

/**
 * Shorthand for required boolean fields
 */
export const RequiredBoolean = (options: Omit<BooleanTransformOptions, 'allowNull'> = {}) =>
  BooleanTransform({ ...options, allowNull: false });

/**
 * Shorthand for optional boolean fields
 */
export const OptionalBoolean = (options: Omit<BooleanTransformOptions, 'allowNull'> = {}) =>
  BooleanTransform({ ...options, allowNull: true });
