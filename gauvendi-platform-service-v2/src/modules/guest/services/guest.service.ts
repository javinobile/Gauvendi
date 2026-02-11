import { Injectable } from '@nestjs/common';
import { GuestRepository } from '../repositories/guest.repository';

@Injectable()
export class GuestService {
  constructor(private readonly guestRepository: GuestRepository) {}

  async adminSyncGuests() {
    return this.guestRepository.adminSyncGuests();
  }
}
