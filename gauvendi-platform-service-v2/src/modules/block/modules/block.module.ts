import { Module } from '@nestjs/common';
import { BlockService } from '../services/block.service';
import { BlockSharedService } from '../services/block-shared.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { BlockController } from '../controllers/block.controller';
import { BlockSharedModule } from './block-shared.module';
import { PmsModule } from '@src/modules/pms/pms.module';

@Module({
  imports: [TypeOrmModule.forFeature([Hotel], DbName.Postgres), BlockSharedModule, PmsModule],
  providers: [BlockService],
  exports: [BlockService],
  controllers: [BlockController]
})
export class BlockModule {}
