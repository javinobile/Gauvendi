import { Column, Entity } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';

export enum BackgroundJobStatusEnum {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED'
}

@Entity({ name: 'background_job' })
export class BackgroundJob extends BaseEntityWithDeleted {
  @Column('varchar', { name: 'name', length: 500 })
  name: string;

  @Column('varchar', { name: 'status', length: 50 })
  status: BackgroundJobStatusEnum;

  @Column('text', { name: 'input', nullable: true })
  input: string | null;

  @Column('text', { name: 'result', nullable: true })
  result: string | null;

  @Column('timestamptz', { name: 'trigger_at', nullable: true })
  triggerAt: Date | null;

  @Column('timestamptz', { name: 'stop_at', nullable: true })
  stopAt: Date | null;
}
