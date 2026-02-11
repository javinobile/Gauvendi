import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity({ name: 'mapping_retail_feature' })
@Index(['hotelRetailFeatureId'])
@Index(['mappingRetailFeatureCode'])
@Index(['hotelRetailFeatureId', 'mappingRetailFeatureCode'], { unique: true })
export class MappingRetailFeature extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_retail_feature_id' })
  hotelRetailFeatureId: string;

  @Column({ type: 'varchar', nullable: true, name: 'mapping_retail_feature_code', length: 255 })
  mappingRetailFeatureCode: string;
}
