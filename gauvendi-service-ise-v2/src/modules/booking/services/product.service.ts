import { Injectable } from '@nestjs/common';

interface CheckAvailabilityParams {
  roomProductCode: string;
  arrival: Date;
  departure: Date;
}

@Injectable()
export class ProductService {
  async isAvailable(params: CheckAvailabilityParams): Promise<boolean> {
    // TODO: Implement actual availability check
    return true;
  }
}
