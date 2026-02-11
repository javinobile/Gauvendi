import { AmenityAvailabilityEnum } from '@src/core/enums/common';

export class ApaleoUtil {
  /**
   * Map AmenityAvailabilityEnum to Apaleo Service Mode
   */
  static mapAmenityAvailabilityToApaleoMode(
    availability: AmenityAvailabilityEnum
  ): 'Arrival' | 'Departure' | 'Daily' {
    switch (availability) {
      case AmenityAvailabilityEnum.ONLY_ON_ARRIVAL:
        return 'Arrival';
      case AmenityAvailabilityEnum.ONLY_ON_DEPARTURE:
        return 'Departure';
      case AmenityAvailabilityEnum.DAILY:
      case AmenityAvailabilityEnum.WEEKLY:
      case AmenityAvailabilityEnum.MONTHLY:
      default:
        return 'Daily';
    }
  }

  /**
   * Map Apaleo Service Mode to AmenityAvailabilityEnum
   */
  static mapApaleoModeToAmenityAvailability(
    mode: 'Arrival' | 'Departure' | 'Daily' | string
  ): AmenityAvailabilityEnum {
    switch (mode) {
      case 'Arrival':
        return AmenityAvailabilityEnum.ONLY_ON_ARRIVAL;
      case 'Departure':
        return AmenityAvailabilityEnum.ONLY_ON_DEPARTURE;
      case 'Daily':
      default:
        return AmenityAvailabilityEnum.DAILY;
    }
  }
}
