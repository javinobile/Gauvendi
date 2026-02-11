import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Currency } from './currency.entity';

@Entity({ name: 'currency_rate' })
@Index(['baseCurrencyId'])
@Index(['exchangeCurrencyId'])
export class CurrencyRate extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'base_currency_id' })
  baseCurrencyId: string;

  @Column({ type: 'uuid', nullable: true, name: 'exchange_currency_id' })
  exchangeCurrencyId: string;

  @Column({ type: 'decimal', nullable: true, name: 'rate', precision: 10, scale: 6 })
  rate: number;

  // Relations
  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'base_currency_id' })
  baseCurrency: Currency;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'exchange_currency_id' })
  exchangeCurrency: Currency;
}