# Automated Length of Stay (LOS) Implementation

## Overview

This implementation provides automated Length of Stay restriction management based on room product availability analysis. The system automatically calculates and applies optimal LOS restrictions to maximize occupancy and revenue.

## API Endpoint

**POST** `/room-products/automate-los`

### Request Body
```json
{
  "hotelId": "required-hotel-uuid",
  "fromDate": "2024-01-15",        // optional, defaults to today
  "toDate": "2024-01-15",          // optional, defaults to today  
  "roomProductIds": [              // optional, if empty processes all active products
    "room-product-uuid-1",
    "room-product-uuid-2"
  ]
}
```

### Response
```json
{
  "processed": 5,
  "skipped": 2,
  "errors": [
    "Room product DELUXE-001: No availability data found"
  ]
}
```

## Automation Modes

### 1. Automated Mode (Default)
- **Trigger**: `isAutomated = true` with both override modes = `false`
- **Behavior**: Auto-calculates max LOS based on consecutive room availability
- **Logic**: `maxLOS = min(max_consecutive_days, hotel_default_max)`
- **Purpose**: Balances dynamic availability with hotel policy constraints
- **Constraint**: Skips updates where `maxLOS ≤ minLOS`

### 2. Override Modes (Mutually Exclusive)

#### Full Gap Mode (`overrideDefaultSetMaximum = true`)
- **Goal**: Prioritize longer bookings within the gap
- **Logic**: `maxLOS = max_consecutive_days`, `minLOS = min(default_min, maxLOS)`
- **Behavior**: Encourages longer stays but doesn't force exact gap booking
- **Example**: 5-day gap, 2-night default min → Allow 2, 3, 4, or 5-night stays
- **Best For**: Long-stay guests, events, premium yield, luxury properties
- **Advantage**: Higher ADR, less turnover, premium positioning
- **Risk**: Gap remains unsold if no long-stay bookings available
Rule: minLOS = maxLOS = gap size
Guest options: Must book the exact gap length (no shorter or longer stays).
Best for: Events, long-stay pricing, premium yield.
Advantage: Keeps high ADR, less room turnover.
Risk: If no one books exactly that length, the gap may remain unsold.
min > max issue: Impossible in this mode because they’re always equal.

#### Dynamic Fill Mode (`overrideDefault = true`) 
- **Goal**: Fill gaps with maximum flexibility to optimize occupancy
- **Logic**: `maxLOS = max_consecutive_days`, `minLOS = 1 night`
- **Behavior**: Permits ANY length stay from 1 night up to gap size
- **Example**: 5-day gap → Allow 1, 2, 3, 4, or 5-night stays (complete flexibility)
- **Best For**: Short-stay guests, high-demand periods, OTA distribution
- **Advantage**: Maximum occupancy, complete booking flexibility
- **Risk**: May block potential long-stay bookings, more turnover
Rule: minLOS = 1, maxLOS = gap size
Guest options: Can book 1 night up to the gap length.
Best for: Low demand periods, OTA visibility, maximizing occupancy.
Advantage: Higher chance of selling remaining nights.
Risk: Short stays might block a potential long-stay booking.
min > max issue: Can’t happen if gap size >= 1, but if gap size drops to 0 due to booking, system must skip or close that date.

## Processing Logic

### Step-by-Step Flow
1. **Date Range Setup**: Extends `toDate` by 6 months for future planning
2. **Product Selection**: Gets active room products with `isAutomated = true`
3. **Availability Analysis**: Analyzes consecutive available periods
4. **LOS Calculation**: Applies mode-specific calculation logic
5. **Constraint Application**: Ensures `maxLOS ≥ minLOS` always
6. **Restriction Updates**: Updates both base and daily restrictions
7. **PMS Integration**: Optionally pushes to Property Management System

### Availability Capacity Logic
A day has available capacity when:
```typescript
(available > 0)
```

### Consecutive Period Detection
- Scans availability data chronologically
- Identifies unbroken sequences of available days
- Uses maximum consecutive period for LOS calculation

## Key Rules & Constraints

### Validation Rules
- ✅ `maxLOS ≥ minLOS` (always enforced)
- ✅ Only one override mode active at a time
- ✅ Automation only processes products with `isAutomated = true`
- ✅ Skips products where `maxLOS ≤ minLOS` in default mode

### Edge Case Handling
- **minLOS > maxLOS**: System sets `maxLOS = minLOS` and logs warning
- **No availability data**: Falls back to hotel default values
- **Zero consecutive days**: Uses minimum LOS as fallback
- **Missing automation settings**: Skips product processing

## Database Impact

### Tables Updated
- `room_product_restriction`: Base LOS restrictions
- `room_product_daily_restriction`: Daily restriction values with `isAutomated = true`
- Existing automated restrictions are removed before applying new ones

### Performance Considerations
- Processes products sequentially to avoid conflicts
- Uses chunked upserts (1500 records) for daily restrictions
- Minimizes database queries through batch operations

## Logging & Monitoring

### Log Levels
- **INFO**: Processing start/completion, successful updates
- **WARN**: Constraint violations, fallback usage
- **ERROR**: Processing failures, data inconsistencies

### Metrics Tracked
- Products processed vs skipped
- Automation mode distribution
- Error rates and types
- Processing duration

## Example Usage Scenarios

### Scenario 1: Hotel-wide Automation
```bash
curl -X POST /room-products/automate-los \
  -H "Content-Type: application/json" \
  -d '{"hotelId": "hotel-123"}'
```

### Scenario 2: Specific Products with Date Range
```bash
curl -X POST /room-products/automate-los \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "hotel-123",
    "fromDate": "2024-02-01",
    "toDate": "2024-02-28",
    "roomProductIds": ["product-1", "product-2"]
  }'
```

## Integration Notes

### Prerequisites
- Room products must have `status = ACTIVE`
- Automation settings must exist with `isAutomated = true`
- Daily availability data must be populated

### PMS Integration
- Supports optional push to Property Management Systems
- Uses existing PMS service infrastructure
- Respects hotel restriction settings for push configuration

## Error Handling

### Common Errors
- **No active products**: Returns 0 processed, logs warning
- **Missing availability data**: Skips product, logs error
- **Invalid date range**: Throws BadRequestException
- **Database constraints**: Logs error, continues processing

### Recovery Mechanisms
- Individual product failures don't stop batch processing
- Detailed error reporting in response
- Comprehensive logging for troubleshooting
