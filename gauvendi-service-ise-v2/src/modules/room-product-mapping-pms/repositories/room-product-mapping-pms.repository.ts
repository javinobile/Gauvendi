// import { BadRequestException, Injectable, Logger } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { DB_NAME } from 'src/core/constants/db.const';
// import { RatePlanPaymentSettlementSetting } from 'src/core/entities/pricing-entities/rate-plan-payment-settlement-setting.entity';
// import { Repository } from 'typeorm';
// import { RatePlanPaymentSettlementSettingDto } from '../dtos/room-product-mapping-pms.dto';

// @Injectable()
// export class RatePlanPaymentSettlementSettingRepository {
//   private readonly logger = new Logger(RatePlanPaymentSettlementSettingRepository.name);
//   constructor(
//     @InjectRepository(RatePlanPaymentSettlementSetting, DB_NAME.POSTGRES)
//     private ratePlanPaymentSettlementSettingRepository: Repository<RatePlanPaymentSettlementSetting>
//   ) {}

//   async getRatePlanPaymentSettlementSetting(
//     body: RatePlanPaymentSettlementSettingDto
//   ): Promise<RatePlanPaymentSettlementSetting | null> {
//     try {
//       const result = await this.ratePlanPaymentSettlementSettingRepository.findOne({
//         where: {
//           hotelId: body.hotelId,
//           ratePlanId: body.ratePlanId
//         }
//       });

//       return result;
//     } catch (error) {
//       this.logger.error('Error getting sales plan payment settlement settings', error);
//       throw new BadRequestException('Error getting sales plan payment settlement settings');
//     }
//   }
// }
