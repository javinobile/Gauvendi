// numeric.transformer.ts
import { ValueTransformer } from "typeorm";

export const NumericTransformer: ValueTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null => (value !== null ? parseFloat(value) : null),
};
