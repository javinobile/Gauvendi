export class CppSearchGuestFilterDto {
  propertyCode: string;
  query?: string;
  pageIndex?: number = 0;
  pageSize?: number = 100;
}

export class CppSearchGuestDto {
  id: string;
  name: string;
  email: string;
}

