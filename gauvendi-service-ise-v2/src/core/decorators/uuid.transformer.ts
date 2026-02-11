import { ValueTransformer } from 'typeorm';
import { stringify } from 'uuid';

export const UuidTransformer: ValueTransformer = {
  from: (value) => value && stringify(value),
  to: (value) => value && Buffer.from(value.replace(/-/g, ''), 'hex'),
};
