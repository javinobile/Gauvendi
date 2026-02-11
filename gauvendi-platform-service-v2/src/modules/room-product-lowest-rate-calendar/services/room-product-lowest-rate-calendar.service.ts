import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DbName } from '../../../core/constants/db-name.constant';
import { ResponseData } from '../../../core/dtos/common.dto';
import { 
  RoomProductLowestRateCalendarDto, 
  RoomProductLowestRateCalendarFilterDto 
} from '../dto';

@Injectable()
export class RoomProductLowestRateCalendarService {
  constructor(
    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource
  ) {}

  async roomProductLowestRateCalendarList(
    filter: RoomProductLowestRateCalendarFilterDto
  ): Promise<{
    data: RoomProductLowestRateCalendarDto[];
    count: number;
    totalPage: number;
  }> {
    // Initialize response with default values (matching Java implementation)
    const response = {
      data: [] as RoomProductLowestRateCalendarDto[],
      count: 0,
      totalPage: 0
    };

    // Only proceed if required parameters are provided (matching Java validation)
    if (!filter.hotelId || !filter.fromDate || !filter.toDate) {
      return response;
    }

    const results = await this.getRoomProductLowestRateCalendarList(filter);
    response.data = results;
    response.count = results.length;
    response.totalPage = 1;

    return response;
  }

  private async getRoomProductLowestRateCalendarList(
    filter: RoomProductLowestRateCalendarFilterDto
  ): Promise<RoomProductLowestRateCalendarDto[]> {
    // Convert the complex Java SQL query to TypeScript
    // This preserves the exact same business logic from the Java implementation
    let rawSqlQuery = `
      select rate_data.date as date, min(rate_data.sellingRate) as lowestRate
      from (
        select base_daily_rate.ratePlanId as rfcRatePlanId, base_daily_rate.date as date, 
               case when (sum(rfra.rate_adjustment - rfra.rate_original) is not null) then
                    (max(base_daily_rate.base_rate) + sum(rfra.rate_adjustment - rfra.rate_original)) 
                    else max(base_daily_rate.base_rate) 
               end as sellingRate
        from (
          select rrp.id as ratePlanId, rrp.hotel_id, dl."Date" as date, rrp.total_base_rate as base_rate
          from room_product_rate_plan rrp
          inner join (
            select ($2::date - INTERVAL '1 day' * (a.a + (10 * b.a) + (100 * c.a) + (1000 * d.a)))::date AS "Date"
            from (
              (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as a
              cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as b
              cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as c
              cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as d
            )
          ) dl on dl."Date" <= $2::date and dl."Date" >= $3::date
        ) base_daily_rate
        left join room_product_feature_rate_adjustment rfra on rfra.date::date = base_daily_rate.date and rfra.room_product_rate_plan_id = base_daily_rate.ratePlanId
        where base_daily_rate.hotel_id = $1
    `;

    const parameters: any[] = [filter.hotelId, new Date(filter.toDate), new Date(filter.fromDate)];

    // Add optional rate plan ID filter (matching Java logic)
    if (filter.rfcRatePlanIdList && filter.rfcRatePlanIdList.length > 0) {
      rawSqlQuery += ` and base_daily_rate.ratePlanId = ANY($${parameters.length + 1})`;
      parameters.push(filter.rfcRatePlanIdList);
    }

    rawSqlQuery += `
        group by base_daily_rate.ratePlanId, base_daily_rate.date
        order by base_daily_rate.date, sellingRate
      ) as rate_data
      group by rate_data.date
      order by rate_data.date
    `;

    try {
      const results = await this.dataSource.query(rawSqlQuery, parameters);
      
      // Map results to DTO format (preserving exact field names and types)
      return results.map((row: any) => ({
        date: row.date,
        lowestRate: parseFloat(row.lowestrate) // Convert to number (matching BigDecimal -> number conversion)
      }));
    } catch (error) {
      console.error('Error executing room product lowest rate calendar query:', error);
      return [];
    }
  }
}
