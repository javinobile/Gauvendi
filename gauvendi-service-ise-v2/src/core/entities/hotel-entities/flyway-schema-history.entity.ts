import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'flyway_schema_history' })
export class FlywaySchemaHistory {
  @Column({ type: 'int', nullable: false, name: 'installed_rank', primary: true })
  installedRank: number;

  @Column({ type: 'int', nullable: true, name: 'version' })
  version: number;

  @Column({ type: 'varchar', nullable: false, name: 'description', length: 200 })
  description: string;

  @Column({ type: 'varchar', nullable: false, name: 'type', length: 20 })
  type: string;

  @Column({ type: 'varchar', nullable: false, name: 'script', length: 1000 })
  script: string;

  @Column({ type: 'int', nullable: true, name: 'checksum' })
  checksum: number;

  @Column({ type: 'varchar', nullable: false, name: 'installed_by', length: 100 })
  installedBy: string;

  @Column({ 
    type: 'timestamptz', 
    nullable: false, 
    name: 'installed_on', 
    default: () => 'CURRENT_TIMESTAMP' 
  })
  installedOn: Date;

  @Column({ type: 'int', nullable: false, name: 'execution_time' })
  executionTime: number;

  @Column({ type: 'boolean', nullable: false, name: 'success' })
  success: boolean;
}
