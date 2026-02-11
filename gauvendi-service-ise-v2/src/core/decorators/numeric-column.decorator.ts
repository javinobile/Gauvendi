import { Column, ColumnOptions } from "typeorm";
import { NumericTransformer } from "./numeric.transformer";

export function NumericColumn(options: ColumnOptions = {}): PropertyDecorator {
  return Column({
    type: "numeric",
    transformer: NumericTransformer,
    ...options,
  });
}
