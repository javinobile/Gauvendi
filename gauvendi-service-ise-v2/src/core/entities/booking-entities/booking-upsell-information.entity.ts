import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Index('idx_booking_id', ['bookingId', 'deletedAt'], {})
@Entity({ name: 'booking_upsell_information' })
export class BookingUpsellInformation extends BaseEntityWithDeleted {
  @Column('uuid', {
    name: 'hotel_id',
    nullable: true
  })
  hotelId: string | null;

  @Column('uuid', {
    name: 'booking_id',
    nullable: true
  })
  bookingId: string | null;

  @Column('text', { name: 'lowest_price_option_list', nullable: true })
  lowestPriceOptionList: string | null;

  @Column('decimal', {
    name: 'lowest_price_total_base_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  lowestPriceTotalBaseAmount: number | null;

  @Column('decimal', {
    name: 'lowest_price_total_tax_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  lowestPriceTotalTaxAmount: number | null;

  @Column('decimal', {
    name: 'lowest_price_total_gross_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  lowestPriceTotalGrossAmount: number | null;

  @Column('decimal', {
    name: 'lowest_price_accommodation_base_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  lowestPriceAccommodationBaseAmount: number | null;

  @Column('decimal', {
    name: 'lowest_price_accommodation_tax_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  lowestPriceAccommodationTaxAmount: number | null;

  @Column('decimal', {
    name: 'lowest_price_accommodation_gross_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  lowestPriceAccommodationGrossAmount: number | null;

  @Column('decimal', {
    name: 'lowest_price_included_service_base_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  lowestPriceIncludedServiceBaseAmount: number | null;

  @Column('decimal', {
    name: 'lowest_price_included_service_tax_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  lowestPriceIncludedServiceTaxAmount: number | null;

  @Column('decimal', {
    name: 'lowest_price_included_service_gross_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  lowestPriceIncludedServiceGrossAmount: number | null;

  @Column('decimal', {
    name: 'lowest_price_service_base_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  lowestPriceServiceBaseAmount: number | null;

  @Column('decimal', {
    name: 'lowest_price_service_tax_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  lowestPriceServiceTaxAmount: number | null;

  @Column('decimal', {
    name: 'lowest_price_service_gross_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  lowestPriceServiceGrossAmount: number | null;

  @Column('decimal', {
    name: 'book_total_base_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  bookTotalBaseAmount: number | null;

  @Column('decimal', {
    name: 'book_total_tax_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  bookTotalTaxAmount: number | null;

  @Column('decimal', {
    name: 'book_total_gross_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  bookTotalGrossAmount: number | null;

  @Column('decimal', {
    name: 'book_accommodation_base_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  bookAccommodationBaseAmount: number | null;

  @Column('decimal', {
    name: 'book_accommodation_tax_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  bookAccommodationTaxAmount: number | null;

  @Column('decimal', {
    name: 'book_accommodation_gross_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  bookAccommodationGrossAmount: number | null;

  @Column('decimal', {
    name: 'book_included_service_base_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  bookIncludedServiceBaseAmount: number | null;

  @Column('decimal', {
    name: 'book_included_service_tax_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  bookIncludedServiceTaxAmount: number | null;

  @Column('decimal', {
    name: 'book_included_service_gross_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  bookIncludedServiceGrossAmount: number | null;

  @Column('decimal', {
    name: 'book_service_base_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  bookServiceBaseAmount: number | null;

  @Column('decimal', {
    name: 'book_service_tax_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  bookServiceTaxAmount: number | null;

  @Column('decimal', {
    name: 'book_service_gross_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  bookServiceGrossAmount: number | null;

  @Column('decimal', {
    name: 'city_tax_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  cityTaxAmount: number | null;
}
