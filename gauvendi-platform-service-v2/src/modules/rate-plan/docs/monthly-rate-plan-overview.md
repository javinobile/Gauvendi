# Monthly Rate Plan Overview Feature

## Overview

The Monthly Rate Plan Overview feature provides comprehensive analytics and metrics for hotel rate plans on a monthly basis. This feature calculates key performance indicators (KPIs) including occupancy rates, average daily rates (ADR), revenue metrics, and trend analysis over a 7-day period.

## Features

### 📊 **Core Metrics**

- **Occupancy Rate**: Percentage of available rooms sold during the month
- **Average Daily Rate (ADR)**: Average revenue per occupied room per day
- **Total Room Revenue**: Total revenue generated from room sales
- **Room Nights**: Total number of room nights sold

### 📈 **Trend Analysis (7-Day)**

- **Occupancy Pace Trend**: Change in occupancy rate compared to previous 7-day period
- **ADR Pickup**: Change in average daily rate compared to previous 7-day period
- **Average Daily Room Pickup**: Average rooms sold per day in the last 7 days
- **Cancellation Count**: Number of cancellations in the last 7 days

### 🔧 **Technical Features**

- **Parallel Data Processing**: Optimized database queries using Promise.all()
- **Flexible Rounding**: Configurable decimal rounding based on hotel settings
- **Tax Handling**: Support for both inclusive and exclusive tax calculations
- **Error Handling**: Comprehensive error handling with detailed logging

## API Endpoint

### Request

```typescript
@MessagePattern({ cmd: CMD.RATE_PLAN.MONTHLY_RATE_PLAN_OVERVIEW })
async monthlyRatePlanOverview(@Payload() filterDto: MonthlyRatePlanOverviewFilterDto)
```

### Request Parameters

| Parameter | Type          | Required | Description                     |
| --------- | ------------- | -------- | ------------------------------- |
| `hotelId` | string (UUID) | Yes      | Unique identifier for the hotel |
| `month`   | string        | Yes      | Month name (e.g., "OCTOBER")    |
| `year`    | number        | Yes      | Year (e.g., 2025)               |

### Response

```typescript
{
  propertyId: string; // Hotel ID
  month: string; // Month name
  year: string; // Year as string
  occupancy: number; // Occupancy rate (0-1 decimal)
  adr: number; // Average Daily Rate
  totalRoomRevenue: number; // Total revenue from rooms
  sevenDayOccupancyPaceTrend: number; // 7-day occupancy trend (0-1 decimal)
  sevenDayPickupAdr: number; // 7-day ADR pickup percentage
  sevenDayAvgDailyRoomPickup: number; // Average daily room pickup
  roomNights: number; // Total room nights sold
  sevenDayRoomNights: number; // Room nights in last 7 days
  sevenDayCancellationCount: number; // Cancellations in last 7 days
  sevenDayPickupAdrBefore: number; // Previous 7-day ADR
  sevenDayOccupancyPaceTrendBefore: number; // Previous 7-day occupancy trend
}
```

## Data Sources

### Primary Entities

- **Reservations**: Reservations (confirmed and cancelled) for occupancy and revenue calculations
- **Room Unit Availability**: Physical room availability data for occupancy calculations
- **Reservation Time Slices**: Daily breakdown of reservation amounts for accurate revenue calculation
- **Room Product Mapping**: MRFC (Master Room and Feature Combination) mappings for availability chain
- **Room Product**: MRFCs and RFCs (Room and Feature Combinations) with status filtering
- **Room Product Assigned Unit**: Mapping between room products and physical room units
- **Hotel Configuration**: Rounding rules and decimal precision settings
- **Hotel**: Basic hotel information including tax settings

### Data Processing Flow

1. **Configuration Retrieval**: Fetch hotel rounding and tax settings
2. **Date Range Calculation**: Determine month boundaries and 7-day periods
3. **Data Aggregation**: Fetch reservations and availability data in parallel
4. **Metrics Calculation**: Calculate all KPIs in parallel for optimal performance
5. **Response Assembly**: Apply rounding rules and format response

## Mathematical Formulas

### 📊 **Core Metrics Formulas**

#### 1. Room Nights Calculation

```
Room Nights = ⌈(Departure Date - Arrival Date) / (1000 × 60 × 60 × 24)⌉
```

- Uses `Math.ceil()` to round up partial days
- Converts milliseconds to days: `(1000 × 60 × 60 × 24) = 86,400,000 ms/day`

#### 2. Occupancy Rate

```
Occupancy Rate (%) = (Total Room Nights Sold / Total Room Nights Available) × 100

Where:
- Total Room Nights Sold = Σ(Room Nights per Reservation)
- Total Room Nights Available = COUNT(RoomUnitAvailability records)

Room Availability Data Source (7-Step Chain):
1. Get RoomProductMapping (MRFC mappings) for the hotel and rate plan
2. Extract MRFC IDs from mappings
3. Get RoomProduct entities (MRFCs) filtering by status: ACTIVE or DRAFT
4. Get related room product IDs from mappings
5. Get RoomProduct entities (RFCs) by these IDs
6. Get RoomProductAssignedUnit to find associated room unit IDs
7. Query RoomUnitAvailability with statuses: AVAILABLE, ASSIGNED, BLOCKED, OUT_OF_ORDER
```

#### 3. Average Daily Rate (ADR)

```
ADR = Total Revenue / Total Room Nights Sold

Where:
- Total Revenue = Σ(ReservationTimeSlice.amount) for dates in month range
- Total Room Nights Sold = Σ(Room Nights per Reservation)

Note: Revenue is calculated using daily time slices (ReservationTimeSlice)
for accurate day-by-day revenue breakdown, not from reservation totals.
```

#### 4. Revenue Calculation

**Data Source:** ReservationTimeSlice (daily breakdown)

**Inclusive Tax Setting:**

```
Total Revenue = Σ(ReservationTimeSlice.totalGrossAmount) for dates in month range
Base Revenue = Σ(ReservationTimeSlice.totalBaseAmount) for dates in month range
Tax Revenue = Σ(ReservationTimeSlice.taxAmount) for dates in month range
```

**Exclusive Tax Setting:**

```
Total Revenue = Σ(ReservationTimeSlice.totalBaseAmount + ReservationTimeSlice.taxAmount)
                for dates in month range
Base Revenue = Σ(ReservationTimeSlice.totalBaseAmount) for dates in month range
Tax Revenue = Σ(ReservationTimeSlice.taxAmount) for dates in month range
```

**Query Logic:**

```typescript
// Filter time slices by date range
timeSlices.filter(
  (slice) => slice.slicedDate >= monthStartDate && slice.slicedDate <= monthEndDate
);
```

### 📈 **7-Day Trend Analysis Formulas**

#### 7. Date Range Calculations

```
Current Period Start = Month End Date - 6 days
Current Period End = Month End Date

Past Period End = Current Period Start - 1 day
Past Period Start = Past Period End - 6 days
```

#### 8. Current Period ADR

```
Current ADR = Current Period Revenue / Current Period Room Nights

Where:
- Current Period Revenue = Σ(ReservationTimeSlice.amount)
  for reservations with:
    * createdAt (booking date) within current 7-day period
    * slicedDate within current 7-day period
    * Status = CONFIRMED

- Current Period Room Nights = Σ(Room Nights)
  for reservations with:
    * createdAt (booking date) within current 7-day period
    * Overlapping with current 7-day period
    * Status = CONFIRMED
```

#### 9. Past Period ADR

```
Past ADR = Past Period Revenue / Past Period Room Nights

Where:
- Past Period Revenue =
  [Real Time Slices Revenue] + [Pseudo Time Slices Revenue]

  Real Time Slices (CONFIRMED reservations):
    Σ(ReservationTimeSlice.amount) for reservations with:
      * createdAt (booking date) within past 7-day period
      * slicedDate within past 7-day period
      * Status = CONFIRMED

  Pseudo Time Slices (CANCELLED reservations):
    For cancelled reservations with:
      * createdAt within past 7-day period
      * updatedAt (cancellation date) AFTER past period end
      * Status = CANCELLED

    Pseudo amount per day = totalGrossAmount / totalRoomNights
    Distributed evenly across all nights within the past period

- Past Period Room Nights = Σ(Room Nights)
  for reservations with:
    * createdAt (booking date) within past 7-day period
    * Overlapping with past 7-day period
    * Status = CONFIRMED or (CANCELLED with updatedAt AFTER past period)
```

#### 10. Occupancy Pace Trend

```
Occupancy Pace Trend (%) = ((Current Room Nights - Past Room Nights) / Past Room Nights) × 100
```

#### 11. ADR Pickup

```
ADR Pickup (%) = ((Current ADR - Past ADR) / Past ADR) × 100
```

#### 12. Average Daily Room Pickup

```
Average Daily Room Pickup = Recently Booked Room Nights / Total Days in Month

Where:
- Recently Booked Room Nights = Σ(Room Nights)
  for reservations with:
    * createdAt (booking date) within current 7-day period
    * Arrival date within the same month (not checkout-based)
    * Status = CONFIRMED

- Total Days in Month = Number of days in the current month

Note: Only counts room nights where the arrival date falls in the target month,
regardless of checkout date. This measures booking velocity for the month.
```

#### 13. Previous Period Occupancy Trend

```
Previous Occupancy Trend = Past Room Nights / (Past Room Nights + Current Room Nights)
```

### 🔢 **Rounding and Precision Formulas**

#### 14. Decimal Conversion (Percentage to Decimal)

```
Decimal Value = Percentage Value / 100
```

#### 15. Rounding with Fallback

```
If Rounding Mode = NO_ROUNDING:
    Effective Rounding Mode = HALF_UP
Else:
    Effective Rounding Mode = Specified Rounding Mode

Final Value = Round(Value, Effective Rounding Mode, Decimal Places)
```

#### 16. Standard Rounding Precision

- **Occupancy Rates**: 4 decimal places (0.0000)
- **ADR Values**: Hotel-specific decimal places (default: 2)
- **Revenue Values**: Hotel-specific decimal places (default: 2)
- **Trend Percentages**: 2 decimal places (0.00)
- **Room Counts**: No rounding (whole numbers)

### 📅 **Date Calculation Formulas**

#### 17. Month Number Conversion

```
Month Number = IndexOf(Month Name in Array) + 1

Month Array = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
               "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]
```

#### 18. Month Date Range

```
Month Start Date = new Date(Year, Month Number - 1, 1)
Month End Date = new Date(Year, Month Number, 0)
```

#### 19. 7-Day Reference Date

```
Reference Date = Current Date - 7 days
```

### 🎯 **Business Logic Rules**

#### 20. Zero Division Protection

```
If Denominator = 0:
    Result = 0
Else:
    Result = Numerator / Denominator
```

#### 21. Tax Setting Priority

```
If Hotel Tax Setting = INCLUSIVE:
    Use totalGrossAmount
Else:
    Use totalBaseAmount + taxAmount
```

#### 22. Default Values

```
If Hotel Tax Setting is null:
    Default to TaxSettingEnum.INCLUSIVE

If Rounding Mode is null:
    Default to RoundingModeEnum.NO_ROUNDING

If Decimal Places is null:
    Default to 2
```

### 🔧 **Key Implementation Changes (Java to NestJS Migration)**

#### Physical Room Availability (RoomUnitAvailability)

**Previous Approach:**

- Used `RoomProductDailyAvailability` (room product level)
- Counted available + sold room products per day

**Current Approach:**

- Uses `RoomUnitAvailability` (physical room level)
- Implements 7-step chain logic to trace from MRFC → RFC → Room Units
- Counts actual physical room availability records
- Filters by statuses: AVAILABLE, ASSIGNED, BLOCKED, OUT_OF_ORDER
- Excludes inactive MRFCs (only ACTIVE or DRAFT status)

**Impact:** More accurate occupancy calculation based on physical room inventory

#### Daily Time Slice Revenue (ReservationTimeSlice)

**Previous Approach:**

- Used reservation totals: `totalGrossAmount`, `totalBaseAmount`, `taxAmount`
- Single amount per entire reservation stay

**Current Approach:**

- Uses `ReservationTimeSlice` for day-by-day breakdown
- Filters time slices by specific date ranges
- Sums `amount`, `totalGrossAmount`, `totalBaseAmount`, `taxAmount` per day
- Enables precise revenue attribution to specific dates

**Impact:** More accurate revenue and ADR calculations for specific time periods

#### 7-Day Trend Analysis Enhancements

**Booking Date Filtering:**

- All trend calculations now filter by `createdAt` (booking date)
- Current period: reservations booked in last 7 days
- Past period: reservations booked in previous 7 days
- Separates booking velocity from stay dates

**Pseudo Time Slices for Cancelled Reservations:**

- Generates synthetic daily amounts for past period cancelled reservations
- Only for reservations cancelled AFTER the past period ended
- Amount per day = `totalGrossAmount / totalRoomNights`
- Distributes evenly across all nights in the past period
- Provides historical ADR comparison including later-cancelled bookings

**Average Daily Room Pickup:**

- New formula: `bookings in 7 days / total days in month`
- Only counts room nights where arrival date is in target month
- Measures booking velocity normalized by month length

**Impact:** More sophisticated trend analysis matching business requirements

### 📊 **Example Calculations**

#### Example 1: Occupancy Rate

```
Given:
- Total Room Nights Sold = 31 (from reservations)
- Total Room Nights Available = 93 (COUNT of RoomUnitAvailability records)
  * Hotel has 3 physical rooms
  * Each room available for 31 days in the month
  * 3 rooms × 31 days = 93 room nights available

Calculation:
Occupancy Rate = (31 / 93) × 100 = 33.33%
Decimal Format = 33.33 / 100 = 0.3333

Note: RoomUnitAvailability records represent physical room availability,
traced through the 7-step chain from MRFC → RFC → Room Units.
```

#### Example 2: ADR Calculation

```
Given:
- Total Revenue = $6,449 (from ReservationTimeSlice records)
  * Day 1: $200
  * Day 2: $210
  * Day 3: $205
  * ... (31 days total)
  * Sum of all daily time slice amounts = $6,449
- Total Room Nights = 31

Calculation:
ADR = $6,449 / 31 = $208.03

Note: Revenue is calculated by summing ReservationTimeSlice.amount
for each day in the month, not from reservation totals.
```

#### Example 3: 7-Day Trend

```
Given:
- Current Period (Oct 25-31):
  * Reservations booked (createdAt) in this period = 5 room nights
  * Current Period Revenue (from time slices) = $1,000
  * Current ADR = $1,000 / 5 = $200

- Past Period (Oct 18-24):
  * Confirmed reservations booked in this period = 2 room nights
  * Cancelled reservations booked in this period but cancelled later = 1 room night
  * Total room nights = 3
  * Revenue (real time slices + pseudo time slices) = $570
  * Past ADR = $570 / 3 = $190

Calculation:
Occupancy Pace Trend = ((5 - 3) / 3) × 100 = 66.67%
ADR Pickup = (($200 - $190) / $190) × 100 = 5.26%
Decimal Format = 66.67 / 100 = 0.6667

Note: Past period includes pseudo time slices for reservations that were
cancelled AFTER the past period ended, to reflect historical booking patterns.
```

#### Example 4: Average Daily Room Pickup

```
Given:
- Current 7-Day Period: Oct 25-31, 2025
- Target Month: October 2025 (31 days)

Reservations booked (createdAt) during Oct 25-31:
  * Reservation A: Arrival Oct 28, 2 room nights
  * Reservation B: Arrival Oct 30, 3 room nights
  * Reservation C: Arrival Nov 1, 2 room nights (excluded, arrival in November)

Recently Booked Room Nights = 2 + 3 = 5 room nights
(Only counting reservations with arrival date in October)

Calculation:
Average Daily Room Pickup = 5 / 31 = 0.16 rooms per day

Note: This measures the booking velocity for the month,
normalized by the total days in the month.
```

## Configuration

### Rounding Modes

- **NO_ROUNDING**: Falls back to HALF_UP for decimal precision
- **HALF_UP**: Standard rounding (0.5 rounds up)
- **HALF_DOWN**: Alternative rounding mode
- **Custom Decimal Places**: Configurable precision (default: 2)

### Tax Settings

- **INCLUSIVE**: Tax included in gross amount
- **EXCLUSIVE**: Tax calculated separately

## Error Handling

### Validation Errors

- **Missing Hotel ID**: Returns `BadRequestException`
- **Invalid Month/Year**: Handled by date calculation logic

### System Errors

- **Database Errors**: Logged with full error details
- **Calculation Errors**: Returns `InternalServerErrorException`

## Performance Optimizations

### Database Queries

- **Parallel Execution**: All data fetching uses `Promise.all()`
- **Selective Fields**: Only required fields are selected from database
- **Efficient Filtering**: Uses indexed fields for date range queries

### Memory Management

- **Streaming Results**: Large datasets processed in chunks
- **Minimal Data Transfer**: Only necessary data is transferred between layers

## Usage Examples

### Basic Usage

```typescript
const filter = {
  hotelId: '3efd68e5-043d-46ae-9f8f-6fbf91da7865',
  month: 'OCTOBER',
  year: 2025
};

const overview = await ratePlanOverviewRepository.monthlyRatePlanOverview(filter);
```

### Response Example

```json
{
  "propertyId": "3efd68e5-043d-46ae-9f8f-6fbf91da7865",
  "month": "OCTOBER",
  "year": "2025",
  "occupancy": 0.34,
  "adr": 208.03,
  "totalRoomRevenue": 6449,
  "sevenDayOccupancyPaceTrend": 0.02,
  "sevenDayPickupAdr": -172.23,
  "sevenDayAvgDailyRoomPickup": 0,
  "roomNights": 31,
  "sevenDayRoomNights": 0,
  "sevenDayCancellationCount": 0,
  "sevenDayPickupAdrBefore": 380.26,
  "sevenDayOccupancyPaceTrendBefore": 0.34
}
```

## Dependencies

### Core Dependencies

- **@nestjs/common**: Framework decorators and exceptions
- **@nestjs/typeorm**: Database ORM integration
- **typeorm**: Database query builder and entity management
- **class-validator**: Request validation

### Internal Dependencies

- **BaseService**: Common service functionality
- **DecimalRoundingHelper**: Precise decimal calculations
- **Hotel Configuration**: Rounding and tax settings
- **Reservation Entities**: Booking data models

## Testing

### Unit Tests

- Individual method testing for each calculation
- Mock data for database interactions
- Edge case handling (empty data, invalid dates)

### Integration Tests

- End-to-end API testing
- Database integration testing
- Performance testing with large datasets

## Monitoring

### Logging

- **Info Level**: Successful operations and key metrics
- **Error Level**: Failed operations with full error context
- **Debug Level**: Detailed calculation steps (development only)

### Metrics

- **Response Time**: API endpoint performance
- **Database Query Time**: Individual query performance
- **Error Rate**: Failed request percentage

## Future Enhancements

### Planned Features

- **Historical Comparisons**: Year-over-year and month-over-month comparisons
- **Forecasting**: Predictive analytics based on trends
- **Custom Date Ranges**: Flexible period selection
- **Export Functionality**: CSV/Excel export capabilities

### Performance Improvements

- **Caching**: Redis-based result caching
- **Background Processing**: Async calculation for large datasets
- **Real-time Updates**: WebSocket-based live updates
