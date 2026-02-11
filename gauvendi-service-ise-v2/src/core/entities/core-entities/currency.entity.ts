import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { CurrencyRate } from './currency-rate.entity';

@Entity({ name: 'currency' })
@Index(['code'])
export class Currency extends BaseEntity {
  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'code', length: 60 })
  code: string;

  @OneToMany(() => CurrencyRate, (currencyRate) => currencyRate.baseCurrency)
  currencyRates: CurrencyRate[];
}
