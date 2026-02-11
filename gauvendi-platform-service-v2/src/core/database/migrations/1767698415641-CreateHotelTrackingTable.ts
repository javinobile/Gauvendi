import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateHotelTrackingTable1767698415641 implements MigrationInterface {
  name = 'CreateHotelTrackingTable1767698415641';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table if not exists
    const tableExists = await queryRunner.hasTable('hotel_tracking');
    if (tableExists) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'hotel_tracking',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()'
          },
          {
            name: 'hotel_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'hotel_code',
            type: 'varchar',
            length: '50',
            isNullable: false
          },
          {
            name: 'hotel_tracking_type',
            type: 'varchar',
            length: '50',
            isNullable: false
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ]
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'hotel_tracking',
      new TableIndex({
        name: 'IDX_hotel_tracking_hotel_id',
        columnNames: ['hotel_id']
      })
    );

    await queryRunner.createIndex(
      'hotel_tracking',
      new TableIndex({
        name: 'IDX_hotel_tracking_hotel_code',
        columnNames: ['hotel_code']
      })
    );

    await queryRunner.createIndex(
      'hotel_tracking',
      new TableIndex({
        name: 'IDX_hotel_tracking_hotel_type_unique',
        columnNames: ['hotel_id', 'hotel_tracking_type'],
        isUnique: true
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('hotel_tracking', 'IDX_hotel_tracking_hotel_type_unique');
    await queryRunner.dropIndex('hotel_tracking', 'IDX_hotel_tracking_hotel_code');
    await queryRunner.dropIndex('hotel_tracking', 'IDX_hotel_tracking_hotel_id');
    await queryRunner.dropTable('hotel_tracking');
  }
}
