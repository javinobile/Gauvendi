import { applyDecorators } from "@nestjs/common";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

/**
 * Decorator that combines ApiProperty, IsNotEmpty and Transform
 * to handle array properties that may be passed as single values
 *
 * Example usage:
 * @ArrayProperty()
 * outletIds: string[];
 */
export function ArrayProperty(options: any = {}) {
  return applyDecorators(
    IsNotEmpty({ each: true }),
    Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  );
}

/**
 * Custom decorator that combines ApiProperty, IsNotEmpty, and Transform
 * with option to make the field optional
 */
export function OptionalArrayProperty(options: any = {}) {
  return applyDecorators(
    IsOptional({ each: true }),
    Transform(({ value }) => (value ? (Array.isArray(value) ? value : [value]) : undefined))
  );
}

/**
 * Simple decorator that ensures values are always converted to arrays
 * even if passed as single values
 */
export function SimpleArrayProperty() {
  return Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []));
}
