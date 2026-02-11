import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity({ name: 'organisation_widget_config' })
@Index(['code'])
@Index(['organisationId'])
@Index(['hotelId'])
@Index(['organisationId', 'hotelId', 'code', 'attribute'], { unique: true })
export class OrganisationWidgetConfig extends BaseEntity {
  @Column({ type: 'varchar', nullable: false, name: 'code', length: 100 })
  code: string;

  @Column({ type: 'uuid', nullable: false, name: 'organisation_id' })
  organisationId: string;

  @Column({ type: 'uuid', nullable: false, name: 'property_id' })
  hotelId: string;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'varchar', nullable: false, name: 'attribute', length: 255 })
  attribute: string;

  @Column({ type: 'varchar', nullable: false, name: 'value', length: 2000 })
  value: string;
}
