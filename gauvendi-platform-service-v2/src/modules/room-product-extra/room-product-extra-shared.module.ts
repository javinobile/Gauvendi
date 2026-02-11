import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DbName } from "@src/core/constants/db-name.constant";
import { RoomProductExtra } from "@src/core/entities/room-product-extra.entity";
import { RoomProductExtraRepository } from "./room-product-extra.repository";


@Module({
  imports: [TypeOrmModule.forFeature([RoomProductExtra], DbName.Postgres), ConfigModule],
  providers: [RoomProductExtraRepository],
  exports: [RoomProductExtraRepository]
})
export class RoomProductExtraSharedModule {}