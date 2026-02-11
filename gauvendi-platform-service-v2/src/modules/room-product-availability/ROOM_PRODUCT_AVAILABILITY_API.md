# Room Product Availability API Documentation

## Overview

The Room Product Availability Service manages hotel room inventory, availability, and booking operations. It handles complex relationships between Master Room Feature Categories (MRFC), Room Feature Categories (RFC), and Enhanced Room Feature Categories (ERFC) products.

## Core Concepts

### Product Types
- **MRFC (Master Room Feature Category)**: Master inventory that controls overall availability
- **RFC (Room Feature Category)**: Derived products that depend on MRFC capacity
- **ERFC (Enhanced Room Feature Category)**: Enhanced products that also depend on MRFC capacity

### Key Relationships
- RFC/ERFC products are linked to MRFC products through shared room units
- MRFC products control the master inventory (available, sellLimit, sold counts)
- RFC/ERFC bookings reduce capacity from their linked MRFC products

---

## API Endpoints

### 1. Check Room Product Availability

**Endpoint:** `POST /room-products/check-availability`

**Purpose:** Validates if a room product has sufficient availability for the requested dates.

**Request Body:**
```json
{
  "hotelId": "string",
  "roomProductId": "string", 
  "arrival": "2024-01-15",
  "departure": "2024-01-17"
}
```

**Response:**
```json
{
  "id": "room-product-id",
  "name": "Deluxe Suite",
  "code": "DLX-001",
  "status": "ACTIVE",
  "type": "MRFC",
  "roomProductDailyAvailabilities": [
    {
      "date": "2024-01-15",
      "available": 5,
      "sellLimit": 5,
      "sold": 2,
      "adjustment": 0
    }
  ],
  "roomProductAssignedUnits": [
    {
      "roomUnitId": "unit-123",
      "roomUnit": {
        "id": "unit-123",
        "roomNumber": "101"
      }
    }
  ]
}
```

**Logic:**
- **MRFC Products**: Checks direct availability (sellLimit/available + adjustment - sold > 0)
- **RFC/ERFC Products**: Finds linked MRFC and validates computed availability
- Validates all dates in the stay period have positive remaining capacity
- Supports overbooking through adjustment values

---

### 2. Process Room Unit Availability Update

**Endpoint:** `POST /room-products/process-unit-availability-update`

**Purpose:** Books room units and updates MRFC availability counts. This is the primary booking function.

**Request Body:**
```json
{
  "hotelId": "db439b72-0ae8-46fd-9b77-999583a95e1c",
  "arrival": "2025-08-12",
  "departure": "2025-08-13", 
  "roomProductId": "744d34a7-7f16-448b-a874-81b7c7bbe2e9",
  "roomUnitIds": [
    "8ceb7555-f355-4960-aebf-3ad6722256c5",
    "e4a4ade8-5fa3-4a09-aef0-2ea834e15192"
  ]
}
```

**Oversell Example:**
```json
{
  "hotelId": "db439b72-0ae8-46fd-9b77-999583a95e1c",
  "arrival": "2025-08-12", 
  "departure": "2025-08-13",
  "roomProductId": "744d34a7-7f16-448b-a874-81b7c7bbe2e9",
  "roomUnitIds": []
}
```

**Response:**
```json
{
  "success": true,
  "datesUpdated": 1
}
```

**Processing Logic:**

#### Step 1: Update Room Unit Status
```sql
-- Mark specified room units as ASSIGNED
INSERT INTO room_unit_availability (hotel_id, room_unit_id, date, status)
VALUES ('hotel-id', 'unit-id', '2025-08-12', 'ASSIGNED')
ON CONFLICT (hotel_id, room_unit_id, date) 
DO UPDATE SET status = 'ASSIGNED';
```

#### Step 2: Handle Product Type

**For MRFC Products:**
```sql
-- Direct MRFC update
UPDATE room_product_daily_availability SET
  available = GREATEST(COALESCE(available, 0) - 2, 0),
  sell_limit = GREATEST(COALESCE(sell_limit, 0) - 2, 0), 
  sold = COALESCE(sold, 0) + 2
WHERE room_product_id = 'mrfc-id' AND date = '2025-08-12';
```

**For RFC/ERFC Products:**
1. Find all MRFCs that share room units with the RFC/ERFC
2. Build per-MRFC unit mapping:
   ```
   Unit 8ceb7555... → MRFC 9f5aebea... (1 unit)
   Unit e4a4ade8... → MRFC 7eefe2da... (1 unit)  
   ```
3. Update each MRFC by its overlapping unit count:
   ```sql
   -- MRFC 9f5aebea updated by 1 (for unit 8ceb7555...)
   -- MRFC 7eefe2da updated by 1 (for unit e4a4ade8...)
   ```

#### Step 3: Handle RFC Allocation Settings

**rfcAllocationSetting = "ALL":**
- Retrieves ALL assigned units for the room product
- Updates ALL units to ASSIGNED status (not just specified ones)
- Updates MRFC availability by the total count of all assigned units

**rfcAllocationSetting = "DEDUCT" (default):**
- Only updates the specified room units
- Updates MRFC availability by the count of specified units

---

### 3. Release Room Product Availability

**Endpoint:** `POST /room-products/release-availability`

**Purpose:** Reverses a booking by releasing room units and restoring MRFC availability counts.

**Request Body:**
```json
{
  "hotelId": "db439b72-0ae8-46fd-9b77-999583a95e1c",
  "arrival": "2025-08-12",
  "departure": "2025-08-13",
  "roomProductId": "744d34a7-7f16-448b-a874-81b7c7bbe2e9", 
  "roomUnitIds": [
    "8ceb7555-f355-4960-aebf-3ad6722256c5",
    "e4a4ade8-5fa3-4a09-aef0-2ea834e15192"
  ]
}
```

**Response:**
```json
[
  {
    "id": "availability-record-id",
    "roomUnitId": "8ceb7555-f355-4960-aebf-3ad6722256c5",
    "date": "2025-08-12",
    "status": "AVAILABLE"
  }
]
```

**Processing Logic:**

#### Step 1: Update Room Unit Status
```sql
-- Change room units from ASSIGNED back to AVAILABLE
UPDATE room_unit_availability SET status = 'AVAILABLE'
WHERE id IN ('record-ids...') AND status = 'ASSIGNED';
```

#### Step 2: Revert MRFC Availability

**For MRFC Products:**
```sql
-- Direct MRFC revert
UPDATE room_product_daily_availability SET
  available = COALESCE(available, 0) + 2,
  sell_limit = COALESCE(sell_limit, 0) + 2,
  sold = GREATEST(COALESCE(sold, 0) - 2, 0)
WHERE room_product_id = 'mrfc-id' AND date = '2025-08-12';
```

**For RFC/ERFC Products:**
- Uses the same per-MRFC unit mapping logic as booking
- Reverts each MRFC by only its overlapping unit count
- Ensures perfect symmetry with the booking operation

---

### 4. Update Room Product Availability

**Endpoint:** `POST /room-products/update-availability`

**Purpose:** Legacy booking function (use `process-unit-availability-update` instead).

**Request Body:**
```json
{
  "hotelId": "string",
  "roomProductId": "string",
  "arrival": "2024-01-15", 
  "departure": "2024-01-17",
  "roomUnitIds": ["unit-1", "unit-2"]
}
```

---

### 5. Get Overlapping RFC/ERFC for MRFC

**Endpoint:** `GET /room-products/linked-mrfc?hotelId=xxx&roomProductId=xxx&arrival=xxx&departure=xxx`

**Purpose:** Retrieves all RFC/ERFC products that share room units with a given MRFC, along with computed availability.

**Response:**
```json
[
  {
    "id": "rfc-product-id",
    "name": "Standard Room", 
    "code": "STD-001",
    "status": "ACTIVE",
    "linkedMrfcList": [
      {
        "id": "mrfc-id",
        "name": "Master Standard",
        "code": "MSTD-001", 
        "status": "ACTIVE"
      }
    ],
    "roomProductDailyAvailabilities": [
      {
        "date": "2024-01-15",
        "available": 3,
        "sellLimit": 2
      }
    ],
    "roomProductAssignedUnits": [
      {
        "roomUnitId": "unit-123",
        "roomUnit": {
          "id": "unit-123", 
          "roomNumber": "101",
          "roomUnitAvailabilities": [
            {
              "date": "2024-01-15",
              "status": "AVAILABLE"
            }
          ]
        }
      }
    ]
  }
]
```

---

### 6. Manual Upsert Daily Availability

**Endpoint:** `POST /room-products/manual-upsert-daily-availability`

**Purpose:** Manually sets availability values for MRFC products over a date range.

**Request Body:**
```json
{
  "hotelId": "string",
  "roomProductId": "string", 
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "available": 10,
  "sellLimit": 8,
  "adjustment": 2
}
```

**Validation:**
- Ensures effective limit (sellLimit/available + adjustment) ≥ current sold count
- Prevents setting availability below already sold inventory

---

## Business Rules

### 1. Capacity Management
- **Effective Limit** = `(sellLimit || available) + adjustment`
- **Remaining Capacity** = `effectiveLimit - sold`
- Bookings can only proceed if remaining capacity > 0 for all dates

### 2. MRFC-RFC/ERFC Relationships
- RFC/ERFC products cannot have more availability than their linked MRFC
- MRFC capacity is shared across all linked RFC/ERFC products
- Each MRFC update is calculated per overlapping room units

### 3. Overbooking Support
- `adjustment` field allows controlled overbooking
- Hotels can sell beyond base availability up to `available + adjustment`
- Oversell bookings (empty roomUnitIds) still consume MRFC capacity

### 4. Allocation Settings
- **ALL**: Updates all assigned units for the product, regardless of specified units
- **DEDUCT**: Only updates the specifically requested units (default)

### 5. Transaction Safety
- All multi-step operations are wrapped in database transactions
- Race condition protection through database-side capacity guards
- Atomic operations ensure data consistency

---

## Error Handling

### Common Error Responses

**400 Bad Request - Insufficient Capacity:**
```json
{
  "statusCode": 400,
  "message": "Not enough capacity to fulfill the requested allocation"
}
```

**400 Bad Request - Invalid Date Range:**
```json
{
  "statusCode": 400, 
  "message": "End date must be greater than or equal to start date"
}
```

**404 Not Found - Product Not Available:**
```json
{
  "statusCode": 404,
  "message": "Room Product not available"
}
```

**404 Not Found - No Linked MRFC:**
```json
{
  "statusCode": 400,
  "message": "No linked MRFC found for the selected product"
}
```

---

## Performance Considerations

### 1. Database Optimization
- Bulk operations for multi-date updates
- Single transaction for atomic operations
- Efficient indexing on (hotel_id, room_product_id, date)

### 2. Query Optimization
- Per-MRFC unit mapping reduces N+1 queries
- Batch room unit status updates
- Optimized joins for related product lookups

### 3. Caching Strategies
- Room product metadata can be cached
- Daily availability should remain real-time
- Unit assignment relationships are relatively stable

---

## Integration Examples

### Booking Flow
```javascript
// 1. Check availability
const availability = await checkAvailability({
  hotelId: "hotel-123",
  roomProductId: "product-456", 
  arrival: "2024-01-15",
  departure: "2024-01-17"
});

// 2. Process booking
if (availability.hasCapacity) {
  const result = await processRoomUnitAvailabilityUpdate({
    hotelId: "hotel-123",
    roomProductId: "product-456",
    arrival: "2024-01-15", 
    departure: "2024-01-17",
    roomUnitIds: ["unit-789", "unit-012"]
  });
}
```

### Cancellation Flow
```javascript
// Release booking
const result = await releaseAvailability({
  hotelId: "hotel-123",
  roomProductId: "product-456",
  arrival: "2024-01-15",
  departure: "2024-01-17", 
  roomUnitIds: ["unit-789", "unit-012"]
});
```

### Inventory Management
```javascript
// Set base availability
await manualUpsertDailyAvailability({
  hotelId: "hotel-123",
  roomProductId: "mrfc-456",
  startDate: "2024-01-15",
  endDate: "2024-01-20",
  available: 10,
  sellLimit: 10,
  adjustment: 2
});
```

---

## Monitoring & Logging

### Key Log Messages
- `"Updated MRFC {id} with {count} overlapping units: [{units}]"`
- `"Reverted MRFC {id} with {count} overlapping units: [{units}]"`
- `"RFC/ERFC with ALL setting: updating {count} units"`
- `"Found {count} related MRFCs to update"`

### Metrics to Monitor
- Booking success/failure rates
- MRFC capacity utilization
- RFC/ERFC to MRFC mapping accuracy
- Transaction rollback frequency
- API response times

---

## Testing Scenarios

### Unit Tests
1. **MRFC Direct Booking**: Verify capacity updates
2. **RFC/ERFC Multi-MRFC**: Test per-MRFC unit mapping
3. **Allocation Setting ALL**: Validate all-unit updates
4. **Oversell Cases**: Test empty roomUnitIds handling
5. **Release Symmetry**: Ensure perfect booking reversal

### Integration Tests
1. **End-to-End Booking Flow**: Complete booking cycle
2. **Concurrent Bookings**: Race condition handling
3. **Mixed Product Types**: MRFC + RFC combinations
4. **Edge Cases**: Zero availability, overbooking limits

### Performance Tests
1. **High Volume Bookings**: Concurrent booking stress test
2. **Large Date Ranges**: Multi-month availability updates
3. **Complex Relationships**: Many RFC/ERFC per MRFC
4. **Database Load**: Transaction throughput testing

---

*Last Updated: December 2024*
*API Version: 2.0*
