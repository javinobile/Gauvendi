export class AuditPayloadDto<T> {
  auditor: string;
  data: T;
  roles?: string[];

  constructor(dto: Partial<AuditPayloadDto<T>>) {
    Object.assign(this, dto);
  }
}
