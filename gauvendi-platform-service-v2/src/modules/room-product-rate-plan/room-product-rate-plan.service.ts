import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DATE_FORMAT } from '@src/core/constants/date.constant';
import { RoomProductRatePlanAvailabilityAdjustment } from '@src/core/entities/room-product-rate-plan-availability-adjustment.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomProductStatus } from '@src/core/enums/common';
import { BadRequestException } from '@src/core/exceptions';
import { OccupancySurchargeCalculateService } from '@src/core/modules/pricing-calculate/services/occupancy-surcharge​-calculate.service';
import { getAllowedDateByDayOfWeek } from '@src/core/utils/datetime.util';
import { formatDate } from 'date-fns';
import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductRatePlan } from 'src/core/entities/room-product-rate-plan.entity';
import { In, IsNull, Not, Repository } from 'typeorm';
import { RatePlanPricingMappingDto } from '../pms/pms.dto';
import { PmsService } from '../pms/pms.service';
import { RatePlanDerivedSettingRepository } from '../rate-plan/repositories/rate-plan-derived-setting.repository';
import { RoomProductExtraOccupancyRateRepository } from '../room-product-extra-occupancy-rate/repositories/room-product-extra-occupancy-rate.repository';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentInputDto } from '../room-product-rate-plan-extra-occupancy-rate-adjustment/dto';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentRepository } from '../room-product-rate-plan-extra-occupancy-rate-adjustment/repositories/room-product-rate-plan-extra-occupancy-rate-adjustment.repository';
import { RoomProductRatePlanAvailabilityAdjustmentInputDto } from './dtos/room-product-rate-plan-availability-adjustment-input.dto';
import { RoomProductRatePlanExtraOccupancyRateDailyFilter } from './dtos/room-product-rate-plan-extra-occupancy-rate-daily.dto';
import {
  GetListRoomProductRatePlanDto,
  GetPmsRatePlanDto,
  GetRoomProductRatePlanIntegrationSettingDto,
  SyncRatePlanPricingDto,
  UpdateRoomProductRatePlanConfigSettingDto,
  UpdateRoomProductRatePlanSellabilityDto
} from './room-product-rate-plan.dto';

@Injectable()
export class RoomProductRatePlanService {
  constructor(
    @InjectRepository(RoomProductRatePlan, DbName.Postgres)
    private readonly roomProductRatePlanRepository: Repository<RoomProductRatePlan>,

    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    private readonly ratePlanDerivedSettingRepository: RatePlanDerivedSettingRepository,

    private readonly pmsService: PmsService,
    private readonly roomProductRatePlanExtraOccupancyRateAdjustmentRepository: RoomProductRatePlanExtraOccupancyRateAdjustmentRepository,

    @InjectRepository(RoomProductRatePlanAvailabilityAdjustment, DbName.Postgres)
    private readonly roomProductRatePlanAvailabilityAdjustmentRepository: Repository<RoomProductRatePlanAvailabilityAdjustment>,

    private readonly roomProductExtraOccupancyRateRepository: RoomProductExtraOccupancyRateRepository,

    private readonly occupancySurchargeCalculateService: OccupancySurchargeCalculateService
  ) {}

  async getList(query: GetListRoomProductRatePlanDto) {
    const { hotelId, roomProductId, ratePlanId } = query;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    const where: any = {
      hotelId
    };

    if (roomProductId) {
      where.roomProductId = roomProductId;
    }

    if (ratePlanId) {
      where.ratePlanId = ratePlanId;
    }

    const result = await this.roomProductRatePlanRepository.find({
      where,
      relations: ['ratePlan', 'roomProduct']
    });

    return result;
  }

  async getPmsRatePlan(query: GetPmsRatePlanDto) {
    const { hotelId } = query;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    return this.pmsService.getPmsRatePlan({ hotelId });
  }

  async updateConfigSetting(body: UpdateRoomProductRatePlanConfigSettingDto) {
    const { hotelId, roomProductRatePlanId, destination, type, mode, connectorType } = body;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }
    if (!roomProductRatePlanId) {
      throw new BadRequestException('Room Product Rate Plan ID is required');
    }

    const roomProductRatePlan = await this.roomProductRatePlanRepository.findOne({
      where: { hotelId, id: roomProductRatePlanId }
    });
    if (!roomProductRatePlan) {
      throw new BadRequestException('Room Product Rate Plan not found');
    }

    try {
      // format destination to store in db
      // ["Mews:60af06cd-0889-4560-a72b-ab3a00b6e90f;3a746194-37ef-4aa3-a1fc-abf0009706af"]
      const formattedDestination = `${connectorType}:${destination.join(';')}`;

      roomProductRatePlan.configuratorSetting = {
        type,
        destination: [formattedDestination],
        mode
      };

      await this.roomProductRatePlanRepository.save(roomProductRatePlan);

      return roomProductRatePlan;
    } catch (error) {
      throw new BadRequestException('Error updating config setting');
    }
  }

  async updateSellability(body: UpdateRoomProductRatePlanSellabilityDto[]) {
    if (body.length === 0) {
      throw new BadRequestException('Body is required');
    }

    const roomProductRatePlanIds = body.map((item) => item.roomProductRatePlanId);

    const values = await this.roomProductRatePlanRepository.find({
      where: {
        hotelId: In(body.map((item) => item.hotelId)),
        id: In(roomProductRatePlanIds)
      }
    });

    if (!values || values.length === 0) {
      throw new BadRequestException('Room Product Rate Plan not found');
    }

    const newValues = body.map((item) => ({
      ...values.find((value) => value.id === item.roomProductRatePlanId),
      isSellable: item.isSellable
    }));

    await this.roomProductRatePlanRepository.upsert(newValues, {
      conflictPaths: ['hotelId', 'roomProductId', 'ratePlanId'],
      skipUpdateIfNoValuesChanged: true
    });

    return newValues;
  }

  async deleteConfigSetting(id: string) {
    const roomProductRatePlan = await this.roomProductRatePlanRepository.findOne({ where: { id } });
    if (!roomProductRatePlan) {
      throw new BadRequestException('Room Product Rate Plan not found');
    }
    try {
      roomProductRatePlan.configuratorSetting = null;
      await this.roomProductRatePlanRepository.save(roomProductRatePlan);
      return roomProductRatePlan;
    } catch (error) {
      throw new BadRequestException('Error deleting config setting' + error.message);
    }
  }

  async syncRatePlanPricing(body: SyncRatePlanPricingDto): Promise<RatePlanPricingMappingDto[]> {
    try {
      const { hotelId, ratePlanId, fromDate, toDate } = body;

      const ratePlan = await this.ratePlanRepository.findOne({
        where: { id: ratePlanId, pmsMappingRatePlanCode: Not(IsNull()), hotelId: hotelId },
        select: {
          id: true,
          pmsMappingRatePlanCode: true
        }
      });

      if (!ratePlan) {
        throw new BadRequestException('Rate Plan not found');
      }

      const ratePlanPricing: RatePlanPricingMappingDto[] =
        await this.pmsService.getPmsRatePlanPricing({
          hotelId,
          ratePlanMappingPmsCode: ratePlan.pmsMappingRatePlanCode!,
          startDate: fromDate,
          endDate: toDate
        });

      return ratePlanPricing;
    } catch (error) {
      throw new BadRequestException('Error syncing rate plan pricing' + error.message);
    }
  }

  async createOrUpdateExtraOccupancyRateAdjustment(
    body: RoomProductRatePlanExtraOccupancyRateAdjustmentInputDto
  ) {
    const { rfcRatePlanId, extraPeople } = body;

    const roomProductRatePlan = await this.roomProductRatePlanRepository.findOne({
      where: { id: rfcRatePlanId },
      relations: {
        roomProduct: true
      }
    });

    if (!roomProductRatePlan) {
      throw new BadRequestException('Room Product Rate Plan not found');
    }

    const roomProduct = roomProductRatePlan.roomProduct;
    if (!roomProduct) {
      throw new BadRequestException('Room Product not found');
    }

    // if (roomProduct.capacityDefault + roomProduct.capacityExtra < extraPeople) {
    //   throw new BadRequestException('Extra People is greater than room product capacity');
    // }

    return this.roomProductRatePlanExtraOccupancyRateAdjustmentRepository.createOrUpdate(body);
  }

  async createOrUpdateAvailabilityAdjustment(
    body: RoomProductRatePlanAvailabilityAdjustmentInputDto
  ) {
    const { hotelId, rfcRatePlanIdList, isSellable, fromDate, toDate, daysOfWeek } = body;

    const dates = getAllowedDateByDayOfWeek(fromDate, toDate, daysOfWeek || []);

    const roomProductRatePlans = await this.roomProductRatePlanRepository.find({
      where: { hotelId, id: In(rfcRatePlanIdList || []) },
      select: {
        id: true,
        ratePlanId: true,
        roomProductId: true
      }
    });

    const ratePlanIds = roomProductRatePlans.map((item) => item.ratePlanId);
    const roomProductIds = roomProductRatePlans.map((item) => item.roomProductId);

    const ratePlanDerivedSettings = await this.ratePlanDerivedSettingRepository.findAll({
      hotelIdList: [hotelId],
      derivedRatePlanIdList: ratePlanIds,
      isFollowDailyRoomProductAvailability: true,
      pageSize: 999
    });

    let derivedRoomProductRatePlans: RoomProductRatePlan[] = [];
    if (ratePlanDerivedSettings.length > 0) {
      const derivedRatePlanIds = ratePlanDerivedSettings.map((item) => item.ratePlanId);
      derivedRoomProductRatePlans = await this.roomProductRatePlanRepository.find({
        where: { hotelId, ratePlanId: In(derivedRatePlanIds), roomProductId: In(roomProductIds) },
        select: {
          id: true,
          ratePlanId: true,
          roomProductId: true
        }
      });
    }

    const derivedRoomProductRatePlanIds = derivedRoomProductRatePlans.map((item) => item.id);

    const derivedRoomProductRatePlanAvailabilityList =
      await this.roomProductRatePlanAvailabilityAdjustmentRepository.find({
        where: {
          hotelId,
          roomProductRatePlanId: In(derivedRoomProductRatePlanIds),
          date: In(dates)
        }
      });

    const roomProductRatePlanAvailabilityList =
      await this.roomProductRatePlanAvailabilityAdjustmentRepository.find({
        where: {
          hotelId,
          roomProductRatePlanId: In(roomProductRatePlans.map((item) => item.id)),
          date: In(dates)
        }
      });

    const newRoomProductRatePlanAvailabilityList: RoomProductRatePlanAvailabilityAdjustment[] = [];
    const updateRoomProductRatePlanAvailabilityList: RoomProductRatePlanAvailabilityAdjustment[] =
      [];
    for (const roomProductRatePlan of roomProductRatePlans) {
      for (const date of dates) {
        const roomProductRatePlanAvailability = roomProductRatePlanAvailabilityList.find(
          (item) =>
            item.roomProductRatePlanId === roomProductRatePlan.id &&
            item.date === date &&
            item.ratePlanId === roomProductRatePlan.ratePlanId &&
            item.hotelId === hotelId
        );
        if (roomProductRatePlanAvailability) {
          roomProductRatePlanAvailability.isSellable = isSellable;
          updateRoomProductRatePlanAvailabilityList.push(roomProductRatePlanAvailability);
        } else {
          const newRoomProductRatePlanAvailability =
            new RoomProductRatePlanAvailabilityAdjustment();
          newRoomProductRatePlanAvailability.hotelId = hotelId;
          newRoomProductRatePlanAvailability.roomProductRatePlanId = roomProductRatePlan.id;
          newRoomProductRatePlanAvailability.date = formatDate(date, DATE_FORMAT);
          newRoomProductRatePlanAvailability.ratePlanId = roomProductRatePlan.ratePlanId;
          newRoomProductRatePlanAvailability.isSellable = isSellable;
          newRoomProductRatePlanAvailabilityList.push(newRoomProductRatePlanAvailability);
        }
      }
    }

    const newDerivedRoomProductRatePlanAvailabilityList: RoomProductRatePlanAvailabilityAdjustment[] =
      [];
    const updateDerivedRoomProductRatePlanAvailabilityList: RoomProductRatePlanAvailabilityAdjustment[] =
      [];
    for (const derivedRoomProductRatePlan of derivedRoomProductRatePlans) {
      for (const date of dates) {
        const derivedRoomProductRatePlanAvailability =
          derivedRoomProductRatePlanAvailabilityList.find(
            (item) =>
              item.roomProductRatePlanId === derivedRoomProductRatePlan.id &&
              item.date === date &&
              item.ratePlanId === derivedRoomProductRatePlan.ratePlanId &&
              item.hotelId === hotelId
          );
        if (derivedRoomProductRatePlanAvailability) {
          derivedRoomProductRatePlanAvailability.isSellable = isSellable;
          updateDerivedRoomProductRatePlanAvailabilityList.push(
            derivedRoomProductRatePlanAvailability
          );
        } else {
          const newDerivedRoomProductRatePlanAvailability =
            new RoomProductRatePlanAvailabilityAdjustment();
          newDerivedRoomProductRatePlanAvailability.hotelId = hotelId;
          newDerivedRoomProductRatePlanAvailability.roomProductRatePlanId =
            derivedRoomProductRatePlan.id;
          newDerivedRoomProductRatePlanAvailability.date = formatDate(date, DATE_FORMAT);
          newDerivedRoomProductRatePlanAvailability.ratePlanId =
            derivedRoomProductRatePlan.ratePlanId;
          newDerivedRoomProductRatePlanAvailability.isSellable = isSellable;
          newDerivedRoomProductRatePlanAvailabilityList.push(
            newDerivedRoomProductRatePlanAvailability
          );
        }
      }
    }

    await this.roomProductRatePlanAvailabilityAdjustmentRepository.save([
      ...newRoomProductRatePlanAvailabilityList,
      ...newDerivedRoomProductRatePlanAvailabilityList,
      ...updateRoomProductRatePlanAvailabilityList,
      ...updateDerivedRoomProductRatePlanAvailabilityList
    ]);

    return null;
  }

  async getDailyOccupancySurchargeRate(body: RoomProductRatePlanExtraOccupancyRateDailyFilter) {
    const { hotelId, fromDate, toDate, roomProductRatePlanIds } = body;
    const roomProductRatePlans = await this.roomProductRatePlanRepository.find({
      where: {
        hotelId,
        id: In(roomProductRatePlanIds)
      }
    });
    const dailyOccupancySurchargeRate =
      await this.occupancySurchargeCalculateService.getDailyOccupancySurchargeRate({
        roomProductRatePlans: roomProductRatePlans,
        fromDate: fromDate,
        toDate: toDate
      });

    return dailyOccupancySurchargeRate.map((item) => ({
      date: item.date,
      roomProductRatePlanId: item.roomProductRatePlanId,
      extraOccupancyRateList: item.extraOccupancyRates.map((r) => ({
        extraPeople: r.extraPeople,
        extraRate: r.extraRate
      }))
    }));
  }

  async getRoomProductRatePlanIntegrationSetting(
    body: GetRoomProductRatePlanIntegrationSettingDto
  ) {
    const { hotelId, ratePlanIds, type } = body;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (!ratePlanIds) {
      throw new BadRequestException('Rate Plan IDs are required');
    }

    if (!type) {
      throw new BadRequestException('Type is required');
    }

    const roomProducts = await this.roomProductRepository.find({
      where: {
        hotelId,
        type,
        status: RoomProductStatus.ACTIVE,
        roomProductRatePlans: { ratePlanId: In(ratePlanIds), hotelId }
      },
      relations: ['roomProductRatePlans'],
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        type: true,
        roomProductRatePlans: {
          id: true,
          code: true,
          ratePlanId: true
        }
      }
    });

    // old dto
    // {
    //   "id": "219469ff-e570-4547-be82-838a54472700",
    //   "code": "MRFC065",
    //   "name": "Family room",
    //   "status": "ACTIVE",
    //   "type": "MRFC",
    //   "rfcRatePlanList": [
    //     {
    //       "code": "MRFC065-BAR",
    //       "ratePlanId": "c6c4d0dc-33cd-45fa-a10f-2512f4359fe8"
    //     },
    //     {
    //       "code": "MRFC065-NONREF",
    //       "ratePlanId": "cda9dd22-eb31-4f4f-94eb-9ed0fe9513f7"
    //     }
    //   ]
    // }

    return (roomProducts || []).map((roomProduct) => ({
      id: roomProduct.id,
      code: roomProduct.code,
      name: roomProduct.name,
      status: roomProduct.status,
      type: roomProduct.type,
      rfcRatePlanList: roomProduct.roomProductRatePlans.map((r) => ({
        code: r.code,
        ratePlanId: r.ratePlanId
      }))
    }));
  }
}
