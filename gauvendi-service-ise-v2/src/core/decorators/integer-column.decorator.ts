// numeric.transformer.ts
import { ValueTransformer } from 'typeorm';

export const IntegerTransformer: ValueTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null => (value !== null ? parseInt(value) : 0),
};

import { Column, ColumnOptions } from 'typeorm';

export function IntegerColumn(options: ColumnOptions = {}): PropertyDecorator {
  return Column({
    type: 'integer',
    transformer: IntegerTransformer,
    ...options,
  });
}
