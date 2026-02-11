import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { ResponseContentStatusEnum } from '@src/core/dtos/common.dto';
import {
  RestrictionAutomationSetting,
  RestrictionAutomationSettings,
  RestrictionAutomationSettingTypeEnum
} from '@src/core/entities/restriction-automation-setting.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomProductRestrictionService } from '@src/modules/room-product-restriction/room-product-restriction.service';
import { Repository } from 'typeorm';
import {
  RestrictionAutomationSettingFilterDto,
  RestrictionAutomationSettingInputDto
} from '../dtos/restriction-automation-setting.dto';
import { RestrictionAutomationSettingRepository } from '../repositories/restriction-automation-setting.repository';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductRelation } from '@src/modules/room-product/room-product.dto';

@Injectable()
export class RestrictionAutomationSettingService {
  constructor(
    private readonly restrictionAutomationSettingRepository: RestrictionAutomationSettingRepository,

    private readonly roomProductRestrictionService: RoomProductRestrictionService,

    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>
  ) {}

  async getRestrictionAutomationSettings(filter: RestrictionAutomationSettingFilterDto) {
    const data =
      await this.restrictionAutomationSettingRepository.getRestrictionAutomationSettings(filter);
    return data;
  }

  async getRestrictionAutomationSettingList(filter: RestrictionAutomationSettingFilterDto) {
    const settings =
      await this.restrictionAutomationSettingRepository.getRestrictionAutomationSettings(filter);

    const { types, relations, referId } = filter;

    let roomProducts: RoomProduct[] = [];
    let ratePlans: RatePlan[] = [];

    const where: any = {
      hotelId: filter.hotelId
    };

    if (referId && referId?.length > 0) {
      where.id = referId;
    }

    // 1. Get ROOM PRODUCTS
    if (types?.includes(RestrictionAutomationSettingTypeEnum.ROOM_PRODUCT)) {
      roomProducts = await this.roomProductRepository.find({
        where
      });
    }

    // 2. Get RATE PLANS
    if (types?.includes(RestrictionAutomationSettingTypeEnum.RATE_PLAN)) {
      ratePlans = await this.ratePlanRepository.find({
        where
      });
    }

    // 3. Create lookup map ONLY for settings
    const settingMap = new Map<string, RestrictionAutomationSetting>();

    (settings || []).forEach((item) => {
      const key = `${item.referenceId}`;
      settingMap.set(key, item);
    });

    let result: any[] = [];

    if (roomProducts.length) {
      result.push(
        ...roomProducts.map((roomProduct) => {
          const setting = settingMap.get(`${roomProduct.id}`);

          return {
            type: 'ROOM_PRODUCT',
            roomProduct: roomProduct, // ALWAYS KEEP ROOM PRODUCT
            ratePlan: null,
            id: setting?.id ?? null,
            referenceId: roomProduct.id,
            isEnabled: setting?.isEnabled ?? false,
            rules: setting?.rules ?? null,
            settings: setting?.settings ?? {
              maxLOS: null,
              minLOS: null,
              gapMode: 'DEFAULT'
            }
          };
        })
      );
    }

    if (ratePlans.length) {
      result.push(
        ...ratePlans.map((ratePlan) => {
          const setting = settingMap.get(
            `${RestrictionAutomationSettingTypeEnum.RATE_PLAN}_${ratePlan.id}`
          );

          return {
            type: 'RATE_PLAN',
            roomProduct: null, // ALWAYS KEEP ROOM PRODUCT
            ratePlan: ratePlan,
            id: setting?.id ?? null,
            referenceId: ratePlan.id,
            isEnabled: setting?.isEnabled ?? false,
            rules: setting?.rules ?? null,
            settings: setting?.settings ?? {
              maxLOS: null,
              minLOS: null,
              gapMode: 'DEFAULT'
            }
          };
        })
      );
    }

    return result;
  }

  async getRatePlanRestrictionAutomationSettings(filter: RestrictionAutomationSettingFilterDto) {
    const data =
      await this.restrictionAutomationSettingRepository.getRestrictionAutomationSettings(filter);
    const mappedData = await this.mapRestrictionAutomationSettings(data, filter.relations);
    return mappedData;
  }

  async updateRestrictionAutomationSettings(input: RestrictionAutomationSettingInputDto[]) {
    const referenceIds = input.map((i) => i.referenceId);
    if (referenceIds.length === 0) {
      return;
    }
    const currentSettings =
      await this.restrictionAutomationSettingRepository.findAllByReferenceId(referenceIds);

    await this.restrictionAutomationSettingRepository.updateRestrictionAutomationSettings(input);

    const changedItems = input.filter((item) => {
      const current = currentSettings.find((c) => c.referenceId === item.referenceId);
      if (!current) return true; // new item

      if (!item.settings) return true;

      const isEnabledChanged = current.isEnabled !== item.isEnabled;
      const isSettingsDifferent = this.isSettingsChanged(current.settings, item.settings);

      return isEnabledChanged || isSettingsDifferent;
    });

    if (changedItems.length > 0) {
      await Promise.all(
        changedItems.map((item) =>
          this.roomProductRestrictionService.process(item.hotelId, item.referenceId, item.type)
        )
      );
    }

    return {
      status: ResponseContentStatusEnum.SUCCESS,
      message: 'Restriction automation settings updated successfully',
      data: true
    };
  }

  isSettingsChanged(a: RestrictionAutomationSettings, b: RestrictionAutomationSettings): boolean {
    if (!a || !b) return true;

    const keysToCheck: (keyof RestrictionAutomationSettings)[] = [
      'minLOS',
      'maxLOS',
      'minLOSThrough',
      'maxLOSThrough',
      'minAdv',
      'maxAdv',
      'isCTA',
      'isCTD',
      'gapMode'
    ];

    for (const key of keysToCheck) {
      const valA = a[key];
      const valB = b[key];

      if (typeof valA === 'object' && typeof valB === 'object') {
        // Deep compare objects (like minLOSThrough, maxLOSThrough)
        if (JSON.stringify(valA) !== JSON.stringify(valB)) return true;
      } else if (valA !== valB) {
        return true;
      }
    }

    return false;
  }

  private async mapRestrictionAutomationSettings(
    data: RestrictionAutomationSetting[],
    relations?: string[]
  ): Promise<any[]> {
    const mappedData: any[] = data.map((item) => {
      return {
        id: item.id,
        type: item.type,
        referenceId: item.referenceId,
        hotelId: item.hotelId,
        isEnabled: item.isEnabled,
        rules: item.rules,
        settings: item.settings,
        ...(relations?.length
          ? relations.reduce(
              (acc, relation) => {
                acc[relation] = item[relation];
                return acc;
              },
              {} as Record<string, any>
            )
          : {})
      };
    });
    return mappedData;
  }
}
