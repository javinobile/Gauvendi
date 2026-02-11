import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { ENV_CONST } from "@src/core/constants/environment.const";
import { chunk } from "lodash";
import { lastValueFrom } from "rxjs";
import { ApaleoRatePlanPmsMappingBulkInput, ApaleoRatePlanPmsMappingListFilter } from "./dtos/apoleo-rate-plan-pms-mapping.dto";
import { CppRatePlanFilterDto } from "./dtos/cpp-rate-plan.dto";
import { GetPmsRatePlanDto } from "./dtos/get-pms-rate-plan.dto";
import { RatePlanProductsToSellDailyFilterDto } from "./dtos/rate-plan-products-to-sell-daily";
import { RoomProductAssignToRatePlanFilterDto } from "./dtos/room-product-assign-to-rate-plan.filter";
import {
  DailyRatePlanAdjustmentListFilter,
  DailySalesPlanPricingBreakdownFilterDto,
  DailyTrendDto,
  DeleteAdjustmentDto,
  DeleteRatePlanDto,
  ExtranetRatePlanFilter,
  MonthlyRatePlanOverviewFilterDto,
  RatePlanDailyHotelOccupancyRateFilterDto,
  RatePlanDto,
  RatePlanFilterDto,
  RoomProductDailyRateDetailsFilter,
  RoomProductDailyRateListFilter,
  SetLowestSellingPriceDto,
  UpsertAdjustmentDto,
  UpsertSalePlanSellAbilityDto,
} from "./rate-plan.dto";

@Injectable()
export class RatePlanService {
  constructor(
    @Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy,
    private readonly configService: ConfigService
  ) {}

  migrateTranslation() {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.MIGRATE_TRANSLATION }, {});
  }

  getListWithExpand(query: ExtranetRatePlanFilter) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.GET_RATE_PLANS }, query);
  }

  createRatePlan(body: RatePlanDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.CREATE }, body);
  }

  updateRatePlan(id: string, body: RatePlanDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.UPDATE }, { id, body });
  }

  upsertAdjustment(id: string, body: UpsertAdjustmentDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.UPSERT_ADJUSTMENT }, { ...body, ratePlanId: id });
  }

  deleteAdjustment(id: string, body: DeleteAdjustmentDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.DELETE_ADJUSTMENT }, { ...body, ratePlanId: id });
  }

  deleteRatePlan(id: string, query: DeleteRatePlanDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.DELETE }, { id, ...query });
  }

  upsertSalePlanSellAbility(salePlanId: string, body: UpsertSalePlanSellAbilityDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.UPSERT_SALES_PLAN_SELL_ABILITY }, { salePlanId, ...body });
  }

  getList(query: RatePlanFilterDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.GET_FOR_PRODUCT }, query);
  }

  getDailyHotelOccupancyRateList(query: RatePlanDailyHotelOccupancyRateFilterDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.DAILY_HOTEL_OCCUPANCY_RATE_LIST }, query);
  }

  async getDailySalesPlanPricingBreakdown(query: DailySalesPlanPricingBreakdownFilterDto) {
    const { salesPlanIdList } = query;

    if (!salesPlanIdList?.length) {
      return await lastValueFrom(this.platformClient.send({ cmd: CMD.RATE_PLAN.DAILY_SALES_PLAN_PRICING_BREAKDOWN }, query));
    }

    const chunkSize = this.configService.get(ENV_CONST.DAILY_RATE_PLAN_PRICING_BREAKDOWN_CHUNK_SIZE) || 5;
    const chunks: string[][] = chunk(salesPlanIdList, chunkSize);

    const allResults = await Promise.all(
      chunks.map((chunk) =>
        lastValueFrom(
          this.platformClient.send(
            { cmd: CMD.RATE_PLAN.DAILY_SALES_PLAN_PRICING_BREAKDOWN },
            {
              ...query,
              salesPlanIdList: chunk,
            }
          )
        )
      )
    );
    const result = allResults.flat();
    return result;
  }

  getRoomProductDailyRateDetails(query: RoomProductDailyRateDetailsFilter) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.GET_ROOM_PRODUCT_DAILY_RATE_DETAILS }, query);
  }

  getRoomProductAssignToRatePlan(query: RoomProductAssignToRatePlanFilterDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.GET_ROOM_PRODUCT_ASSIGN_TO_RATE_PLAN }, query);
  }

  getRoomProductDailyRateList(query: RoomProductDailyRateListFilter) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.ROOM_PRODUCT_DAILY_RATE_LIST }, query);
  }

  getRatePlanSellabilityList(query: DailyRatePlanAdjustmentListFilter) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.DAILY_RATE_PLAN_ADJUSTMENT_LIST }, query);
  }

  setLowestSellingPrice(query: SetLowestSellingPriceDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.SET_LOWEST_SELLING_PRICE }, query);
  }

  getMonthlyRatePlanOverview(query: MonthlyRatePlanOverviewFilterDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.MONTHLY_RATE_PLAN_OVERVIEW }, query);
  }

  getRatePlanProductsToSellDailyList(query: RatePlanProductsToSellDailyFilterDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.PRODUCTS_TO_SELL_DAILY_LIST }, query);
  }

  getPmsRatePlan(query: GetPmsRatePlanDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.GET_PMS_RATE_PLAN }, query);
  }

  getApaleoRatePlanPmsMappingList(query: ApaleoRatePlanPmsMappingListFilter) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.GET_APALEO_RATE_PLAN_PMS_MAPPING_LIST }, query);
  }

  upsertApaleoRoomProductRatePlanPmsMapping(query: ApaleoRatePlanPmsMappingBulkInput) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.CREATE_OR_UPDATE_APALEO_ROOM_PRODUCT_RATE_PLAN_PMS_MAPPING }, query);
  }

  upsertApaleoRatePlanPmsMapping(query: ApaleoRatePlanPmsMappingBulkInput) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.CREATE_OR_UPDATE_APALEO_RATE_PLAN_PMS_MAPPING }, query);
  }

  getCppRatePlanList(query: CppRatePlanFilterDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.GET_CPP_RATE_PLAN_LIST }, query);
  }

  onboardRatePlan(body: { hotelId: string }) {
    return this.platformClient.send({ cmd: "onboard_whip_rate_plan" }, body);
  }

  getDailyPropertyPaceTrends(query: DailyTrendDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.GET_DAILY_PROPERTY_PACE_TRENDS }, query);
  }

  getDailyPropertyPickupAdrList(query: DailyTrendDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.GET_DAILY_PROPERTY_PICKUP_ADR_LIST }, query);
  }

  getDailyPropertyADRList(query: DailyTrendDto) {
    return this.platformClient.send({ cmd: CMD.RATE_PLAN.GET_DAILY_PROPERTY_ADR_LIST }, query);
  }
}
