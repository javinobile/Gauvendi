import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity({ name: 'mapping_standard_feature' })
@Index(['hotelStandardFeatureId'])
@Index(['mappingStandardFeatureCode'])
@Index(['hotelStandardFeatureId', 'mappingStandardFeatureCode'], { unique: true })
export class MappingStandardFeature extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_standard_feature_id' })
  hotelStandardFeatureId: string;

  @Column({ type: 'varchar', nullable: true, name: 'mapping_standard_feature_code', length: 255 })
  mappingStandardFeatureCode: string;
}
