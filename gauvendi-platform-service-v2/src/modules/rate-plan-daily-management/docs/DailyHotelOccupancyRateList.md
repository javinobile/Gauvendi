## **Database Tables Structure**

### **Core Tables**
```sql
-- Table chính lưu daily data
mrfc_daily {
    id: UUID,
    hotel_id: UUID,
    mrfc_mapping_id: UUID,
    date: Date,
    sold: Integer,                  -- Manual adjustment
    available_to_sell: Integer,     -- Manual adjustment  
    total_room_inventory: Integer   -- Manual adjustment
}

-- Mapping channels (PMS, GAUVENDI, DIRECT, etc)
mrfc_mapping {
    id: UUID,
    hotel_id: UUID,
    mrfc_id: UUID,
    related_code: String,    -- External system room type code
    channel: ChannelCode     -- GAUVENDI, PMS, DIRECT, etc
}

-- Master Room Feature Category
mrfc {
    id: UUID,
    hotel_id: UUID,
    rfc_id: UUID,
    code: String,
    name: String
}

-- Room assignment to RFC
rfc_room {
    id: UUID,
    rfc_id: UUID,
    room_id: UUID
}
```

## **Data Sources & Business Logic**

### **1. Input Processing**
```java
// MrfcDailyServiceImpl.java line 151-153
UUID hotelId = filter.getHotelId();
LocalDate fromDate = filter.getFromDate();
LocalDate toDate = filter.getToDate();
```

### **2. Reservations Data (line 161-164)**
```java
// Lấy reservations với status: RESERVED, CONFIRMED, PROPOSED
// Expand: booking, reservationRoom
// DateFilter: STAYING (phòng đang ở trong khoảng date)
List<ReservationDto> reservationList = getReservationList(filter, expand);
```

### **3. Room Availability Data (line 233-247)**
```java
// Lấy room availability status: OUT_OF_ORDER, OUT_OF_INVENTORY, ASSIGNED, AVAILABLE
Map<LocalDate, List<RoomAvailabilityDto>> outOfOrderRoomsPerDay = ...;
Map<LocalDate, List<RoomAvailabilityDto>> outOfInventoryRoomsPerDay = ...;
Map<LocalDate, List<RoomAvailabilityDto>> assignedRoomsPerDay = ...;  
Map<LocalDate, List<RoomAvailabilityDto>> availableRoomsPerDay = ...;
```

### **4. RFC Availability Adjustment (line 256-263)**
```java
// Lấy availability adjustment từ RFC Availability Adjustment service
List<RfcAvailabilityAdjustmentDto> rfcAvailabilityAdjustmentList = 
    availabilityServiceRemote.rfcAvailabilityAdjustmentList(filter);
```

## **Field Calculation Logic**

### **Occupancy Rate Calculation (line 310)**
```typescript
occupancyRate = totalRoomSold / totalPropertyRooms

// Với:
totalPropertyRooms = totalRoomInventory - totalOutOfInventoryRoomCount  // line 275
totalRoomSold = sum của tất cả room sold từ các channel                 // line 291-301
```

### **Room Status Fields**
```typescript
// line 269-274
totalOutOfOrderRoomCount = outOfOrderRoomsPerDay[date].size()
totalOutOfInventoryRoomCount = outOfInventoryRoomsPerDay[date].size()
totalPropertyRooms = totalRoomInventory - totalOutOfInventoryRoomCount
totalRoomInventory = roomList.size()  // Total physical rooms (line 231)
```

### **Room Assignment Fields**
```typescript
// line 277-282
totalAssignedRoomCount = assignedRoomsPerDay[date].size()     // Phòng đã assign cụ thể
totalAvailableRoomCount = availableRoomsPerDay[date].size()   // Phòng available chưa assign

// line 326-327 
totalRoomsSoldAssigned = assignedRoomSoldOfChannelByDate[date]     // Sold & assigned
totalRoomsSoldUnassigned = unassignedRoomSoldOfChannelByDate[date] // Sold & not assigned

// Set trong loop reservations (line 219-225)
// Nếu reservation có reservationRoomList -> assigned, ngược lại -> unassigned
```

### **Channel-based Room Sold Calculation (line 183-229)**
```typescript
// Loop qua tất cả reservations
for (ReservationDto reservation : reservationList) {
    // Bỏ qua reservation với payment mode = "GUAWCC" và status = RESERVED
    // Determine channel: PMS hoặc GAUVENDI (default)
    
    // Tính số đêm ở (arrival -> departure, không bao gồm departure date)
    for (date = fromDate; date <= toDate; date++) {
        if (date >= arrival && date < departure) {
            roomSoldOfChannelByDate[date]++
            
            if (reservation has reservationRoomList) {
                assignedRoomSoldOfChannelByDate[date]++
            } else {
                unassignedRoomSoldOfChannelByDate[date]++
            }
        }
    }
}
```

### **Availability Calculations**
```typescript
// line 284-289: Available to sell từ RFC Availability Adjustment
availableToSell = sum(availabilityPerDate.availableToSell)

// line 303: Available property rooms  
totalAvailablePropertyRooms = totalPropertyRooms - totalOutOfOrderRoomCount - totalRoomSold

// line 304: Availability adjustment
totalAvailabilityAdjustment = availableToSell - totalAvailablePropertyRooms
```

### **Channel Lists (line 292-308)**
```typescript
// Room Sold List - theo từng channel
roomSoldList = [
    { channel: "GAUVENDI", value: soldOfGauvendiChannel },
    { channel: "PMS", value: soldOfPmsChannel }
]

// Available to Sell List - chỉ có GAUVENDI channel
availableToSellList = [
    { channel: "GAUVENDI", value: availableToSell }
]
```

## **Connector-specific Logic**

### **OHIP Connector Handling (line 172-181)**
```java
// Đối với OHIP connector: Filter bỏ inactive inventory
// - Lấy inactive MRFC (status = INACTIVE)  
// - Lấy room IDs từ inactive MRFC
// - Remove reservations của inactive MRFC
// - Remove inactive rooms từ room list
```

## **Final Output Mapping (line 312-328)**
```java
return DailyOccupancyRate.builder()
    .date(date)
    .occupancyRate(occupancyRate)                    // totalRoomSold / totalPropertyRooms
    .totalRoomInventory(totalRoomInventory)          // roomList.size()
    .totalOutOfInventory(totalOutOfInventoryRoomCount)  // OUT_OF_INVENTORY rooms
    .totalPropertyRooms(totalPropertyRooms)          // inventory - out_of_inventory  
    .totalOutOfOrder(totalOutOfOrderRoomCount)       // OUT_OF_ORDER rooms
    .totalOutOfService(0)                            // Luôn = 0 (không implement)
    .roomSoldList(roomSoldList)                      // Sold theo channel
    .totalAvailablePropertyRooms(totalAvailablePropertyRooms)  // property - outOfOrder - sold
    .totalAvailabilityAdjustment(totalAvailabilityAdjustment)  // availableToSell - availableProperty
    .availableToSellList(availableToSellList)        // Available theo channel
    .totalRoomsAssigned(totalAssignedRoomCount)      // ASSIGNED status rooms
    .totalRoomsUnassigned(totalAvailableRoomCount)   // AVAILABLE status rooms  
    .totalRoomsSoldAssigned(assignedRoomSoldCount)   // Sold có room assignment
    .totalRoomsSoldUnassigned(unassignedRoomSoldCount) // Sold không có room assignment
    .build();
```

## **Key Business Rules**

1. **Room Night Calculation**: Tính theo arrival <= date < departure (không bao gồm departure date)
2. **Channel Mapping**: Reservation channel = "PMS" → ChannelCode.PMS, otherwise → ChannelCode.GAUVENDI  
3. **Payment Filter**: Bỏ qua RESERVED reservation với payment mode = "GUAWCC"
4. **Room Assignment**: Có reservationRoomList → assigned, không có → unassigned
5. **Availability**: availableToSell từ RFC Availability Adjustment service
6. **OHIP Special**: Filter inactive inventory cho OHIP connector

## **Data Dependencies**

1. **Booking Service**: Reservations data
2. **Availability Service**: Room availability status & RFC availability adjustments  
3. **Hotel Service**: Hotel info & connectors
4. **Local DB**: MRFC, MRFC Mapping, RFC Room relationships

Với logic này, bạn có thể implement lại API trong NestJS project bằng cách replicate các calculation steps và data sources tương ứng.