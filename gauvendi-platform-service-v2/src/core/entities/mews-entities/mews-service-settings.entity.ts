import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'mews_service_settings' })
export class MewsServiceSettings extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'varchar', name: 'service_id' })
  serviceId: string;

  @Column({ type: 'varchar', name: 'enterprise_id' })
  enterpriseId: string;

  @Column({ type: 'varchar', name: 'service_type' })
  serviceType: string;

  @Column({ type: 'varchar', name: 'timezone' })
  timezone: string;

  @Column({ type: 'varchar', name: 'property_pricing_setting' })
  propertyPricingSetting: string;
}
