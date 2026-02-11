# So Sánh Công Thức Tính Giá - Gauvendi Platform

## Tổng Quan

Hệ thống có **6 phương pháp tính giá** chính:

| STT | Phương Pháp | Service | Enum | Mô Tả Ngắn |
|-----|-------------|---------|------|------------|
| 1 | **Feature Pricing** | `FeatureCalculationService` | `PRODUCT_BASED_PRICING` | Tính giá dựa trên retail features |
| 2 | **Average Pricing** | `ProductBaseAverageService` | N/A | Tính trung bình giá từ nhiều sản phẩm |
| 3 | **Reversed Pricing** | `ReversedProductService` | `PMS_PRICING` | Tính ngược từ sản phẩm nguồn |
| 4 | **Attribute Logic** | `AttributeLogicService` | N/A (Mode) | RFC lấy giá cao nhất từ MRFC |
| 5 | **Positioning** | `HandlePositioningService` | N/A (Mode) | Tính theo occupancy & availability |
| 6 | **Derived Product** | `DerivedProductService` | `DERIVED` | Tính từ rate plan khác |
| 7 | **Link Product** | `LinkProductService` | `LINK` | Liên kết từ sản phẩm khác |

---

## 1. Feature Pricing (Product-Based Pricing)

### Công Thức

```typescript
featureBasedRate = Σ (retailFeature.baseRate × quantity)

// Nếu có điều chỉnh hàng ngày (daily adjustment):
rate = dailyAdjustment ?? retailFeature.baseRate

// Tổng giá:
totalFeatureRate = Σ (rate × quantity)
```

### Quy Trình

1. Lấy tất cả `RoomProductRetailFeature` của room product
2. Với mỗi feature:
   - Lấy `baseRate` từ `retailFeature`
   - Kiểm tra có `dailyAdjustment` cho ngày cụ thể không
   - Nhân với `quantity`
3. Cộng tất cả lại

### Điều Kiện

- Room product phải có retail features
- Features phải có `baseRate` không null

### Ví Dụ

```typescript
// Room Product có 3 features:
- Bed (baseRate: 50, quantity: 2) = 100
- TV (baseRate: 20, quantity: 1) = 20
- Minibar (baseRate: 30, quantity: 1) = 30

→ featureBasedRate = 100 + 20 + 30 = 150
```

### File Reference

```1:73:src/modules/room-product-rate-plan/room-product-selling-price/feature-calculation.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomProductAssignedUnit } from 'src/core/entities/room-product-assigned-unit.entity';
import { RoomProductFeatureRateAdjustment } from 'src/core/entities/room-product-feature-rate-adjustment.entity';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';
import { RoomProductStatus, RoomProductType } from 'src/core/enums/common';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';
import { Helper } from 'src/core/helper/utils';
import { In, IsNull, Not, Repository } from 'typeorm';

export interface FeatureCalculationOptions {
  roomProductId: string;
  hotelId: string;
  fromDate?: string;
  toDate?: string;
  useDaily?: boolean;
  isAverage?: boolean;

  pricingMethodAdjustmentValue?: number;
  pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
}

export interface FeatureCalculationResult {
  date?: string;
  featureBasedRate: number;
  roomProductCode: string;
  roomProductName: string;
  linkedRoomProducts?: FeatureCalculationResult[];
}

export interface DailyFeatureCalculationResult {
  date: string;
  featureBasedRate: number;
  roomProductCode: string;
  roomProductName: string;
  linkedRoomProducts?: FeatureCalculationResult[];
}

@Injectable()
export class FeatureCalculationService {
  private readonly logger = new Logger(FeatureCalculationService.name);

  constructor(
    @InjectRepository(RoomProductRetailFeature, DbName.Postgres)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,

    @InjectRepository(RoomProductFeatureRateAdjustment, DbName.Postgres)
    private readonly roomProductFeatureRateAdjustmentRepository: Repository<RoomProductFeatureRateAdjustment>,

    @InjectRepository(RoomProductAssignedUnit, DbName.Postgres)
    private readonly roomProductAssignedUnitRepository: Repository<RoomProductAssignedUnit>
  ) {}

  /**
   * Calculate feature-based pricing with flexible options
   */
  async calculateFeatureBasedPrice(
    options: FeatureCalculationOptions
  ): Promise<FeatureCalculationResult[]> {
    try {
      this.validateOptions(options);

      if (options.useDaily && options.fromDate && options.toDate) {
        return await this.calculateDailyFeaturePrice(options);
      } else {
        const result = await this.calculateBaseFeaturePrice(options);
        return result ? [result] : [];
      }
    } catch (error) {
      throw new BadRequestException(`Failed to calculate feature-based price: ${error.message}`);
    }
  }
```

---

## 2. Average Pricing

### Công Thức

```typescript
// Tính trung bình từ nhiều related room products
averagePrice = Σ (relatedProduct.basePrice) / count(relatedProducts)

// Hoặc tổng (không phải trung bình):
totalPrice = Σ (relatedProduct.basePrice)
```

### Quy Trình

1. Lấy danh sách related room products (thông qua assigned units)
2. Tính giá cho từng related product
3. Tính trung bình hoặc tổng
4. Áp dụng adjustment (nếu có)

### Điều Kiện

- Phải có related room products
- Related products phải có giá

### Ví Dụ

```typescript
// RFC có 3 related MRFCs:
- MRFC_1: basePrice = 100
- MRFC_2: basePrice = 120
- MRFC_3: basePrice = 90

// Average:
averagePrice = (100 + 120 + 90) / 3 = 103.33

// Sum:
totalPrice = 100 + 120 + 90 = 310
```

---

## 3. Reversed Pricing

### Công Thức

```typescript
// Bước 1: Lấy giá từ sản phẩm nguồn
sourcePrice = basePrice[date] từ roomProductId gốc

// Bước 2: Áp dụng điều chỉnh
IF (pricingMethodAdjustmentUnit === 'PERCENTAGE'):
    reversedBasePrice = sourcePrice × (1 + adjustmentValue / 100)
ELSE IF (pricingMethodAdjustmentUnit === 'FIXED'):
    reversedBasePrice = sourcePrice + adjustmentValue

// Bước 3: Áp dụng cho related products
```

### Quy Trình

1. Tìm related room products (từ `roomProductMapping`)
2. Lấy base prices của sản phẩm nguồn
3. Với mỗi related product:
   - Lấy giá nguồn theo ngày
   - Áp dụng adjustment
   - Tính giá bán cuối cùng

### Điều Kiện

- `pricingMethod` = `PMS_PRICING`
- Phải có room product mappings
- Sản phẩm nguồn phải có giá

### Ví Dụ

```typescript
// Product A (nguồn) có basePrice = 100
// Product B (reversed) có adjustment = +10% 

reversedBasePrice[B] = 100 × (1 + 10/100) = 110

// Nếu adjustment = +20 (FIXED):
reversedBasePrice[B] = 100 + 20 = 120
```

### File Reference

```158:162:src/modules/room-product-rate-plan/room-product-pricing-method-detail/reversed-product.service.ts
        const basePrice = DecimalRoundingHelper.calculatePriceAdjustment(
          relatedPrices,
          pricingMethodAdjustmentValue,
          pricingMethodAdjustmentUnit
        );
```

---

## 4. Attribute Logic

### Công Thức

```typescript
// RFC Attribute Logic:
rfcBasePrice[date] = MAX(mrfcBasePrices[date])

// Điều kiện:
- MRFC phải có availability > 0
- MRFC basePrice > 0
- maxMrfcPrice > rfcPrice (chỉ update khi MRFC cao hơn)
```

### Quy Trình

**Cho RFC:**
1. Tìm tất cả related MRFCs
2. Lọc MRFCs có availability > 0 trong ngày
3. Lấy giá cao nhất từ các MRFCs available
4. Nếu maxMrfcPrice > rfcPrice hiện tại → update

**Cho MRFC:**
1. Tìm tất cả related RFCs
2. Tính trung bình giá của các RFCs
3. Áp dụng adjustment

### Điều Kiện

- Rate plan phải có `rfcAttributeMode = true`
- Phải có related products (RFC ↔ MRFC)
- Products phải có availability

### Ví Dụ

```typescript
// Ngày 2024-01-01:
// RFC có giá: 80
// Related MRFCs:
- MRFC_1: price = 100, available = 5 ✓
- MRFC_2: price = 120, available = 0 ✗ (không available)
- MRFC_3: price = 90, available = 3 ✓

maxMrfcPrice = MAX(100, 90) = 100
→ RFC price = 100 (vì 100 > 80)
```

### File Reference

```167:181:src/modules/room-product-rate-plan/room-product-pricing-method-detail/attribute-logic.service.ts
      const rfcPrice = rfcSellingPrice.basePrice;

      const maxMrfcPrice = Math.max(...mrfcSellingPrices.map((price) => price.basePrice));

      if (maxMrfcPrice <= 0 || rfcPrice >= maxMrfcPrice) {
        continue;
      }

      inputs.push({
        hotelId,
        roomProductId: rfcRoomProductId,
        ratePlanId,
        date,
        basePrice: maxMrfcPrice,
      });
```

---

## 5. Positioning (MRFC Positioning)

### Công Thức

```typescript
// Bước 1: Lấy giá của related RFCs có availability
availableRfcPrices = RFCs.filter(availability[date] > 0).map(basePrice)

// Bước 2: Sắp xếp theo giá tăng dần
sortedPrices = availableRfcPrices.sort()

// Bước 3: Tính cutoff dựa trên occupancy
occupancyRate = occupancy[date] // 0 - 1
cutoff = Math.ceil(occupancyRate × sortedPrices.length)

// Bước 4: Tính trung bình của phần cutoff
IF (occupancyRate === 0):
    basePrice = sortedPrices[0]  // Giá thấp nhất
ELSE:
    basePrice = AVG(sortedPrices[0...cutoff])

// Bước 5: Áp dụng adjustment (nếu có)
IF (pricingMethod === PRODUCT_BASED_PRICING):
    finalPrice = calculatePriceAdjustment(basePrice, adjustmentValue, adjustmentUnit)
```

### Quy Trình

1. Lấy daily occupancy rates
2. Lấy giá và availability của related RFCs
3. Với mỗi ngày:
   - Lọc RFCs có availability > 0
   - Sắp xếp giá tăng dần
   - Tính cutoff theo occupancy
   - Tính trung bình giá trong cutoff range
   - Áp dụng adjustment

### Điều Kiện

- Rate plan phải có `mrfcPositioningMode = true`
- Phải có occupancy data
- Phải có related products với availability

### Ví Dụ

```typescript
// Ngày 2024-01-01, Occupancy = 60%
// Related RFCs có giá: [80, 100, 120, 150, 200]

sortedPrices = [80, 100, 120, 150, 200]
cutoff = Math.ceil(0.6 × 5) = 3

basePrice = AVG([80, 100, 120]) = (80 + 100 + 120) / 3 = 100

// Nếu occupancy = 0%:
basePrice = 80 (giá thấp nhất)

// Nếu occupancy = 100%:
cutoff = 5
basePrice = AVG([80, 100, 120, 150, 200]) = 130
```

### File Reference

```191:219:src/modules/room-product-rate-plan/room-product-pricing-method-detail/handle-positioning.service.ts
      const sortedPrices = [...filteredPrices].sort((a, b) => a.basePrice - b.basePrice);
      const occPercentage = Math.max(0, Math.min(1, occPerDate[date] || 0));

      let basePrice: number;
      if (occPercentage === 0) {
        basePrice = sortedPrices[0].basePrice;
      } else {
        const cutoff = Math.ceil(occPercentage * sortedPrices.length);
        const avg = sortedPrices.slice(0, cutoff).reduce((sum, p) => sum + p.basePrice, 0) / cutoff;
        basePrice = avg;
      }

      if (
        roomProductPricingMethodDetail.pricingMethod ===
        RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING
      ) {
        basePrice = DecimalRoundingHelper.calculatePriceAdjustment(
          basePrice,
          adjustmentValue,
          adjustmentUnit
        );
      }

      inputs.push({
        hotelId,
        roomProductId, // again: ensure this is the correct one, not outer-scope
        ratePlanId,
        date,
        basePrice
```

---

## 6. Derived Product

### Công Thức

```typescript
// Lấy giá từ target rate plan
sourceBasePrice = basePrice từ targetRatePlanId

// Áp dụng điều chỉnh
IF (adjustmentUnit === 'PERCENTAGE'):
    derivedBasePrice = sourceBasePrice × (1 + adjustmentValue / 100)
ELSE IF (adjustmentUnit === 'FIXED'):
    derivedBasePrice = sourceBasePrice + adjustmentValue
```

### Quy Trình

1. Xác định quan hệ base-derived rate plans
   - Nếu rate plan hiện tại là base → tìm derived
   - Nếu rate plan hiện tại là derived → tìm base
2. Lấy giá từ target rate plan
3. Áp dụng adjustment
4. Tính giá bán cho derived rate plan

### Điều Kiện

- `pricingMethod` = `DERIVED`
- Phải có `RatePlanDerivedSetting`
- Target rate plan phải có giá

### Ví Dụ

```typescript
// Rate Plan A (BAR) = 100
// Rate Plan B (Corporate) derived từ A với -10%

derivedBasePrice[B] = 100 × (1 - 10/100) = 90

// Rate Plan C (Government) derived từ A với -20 (FIXED)
derivedBasePrice[C] = 100 - 20 = 80
```

---

## 7. Link Product

### Công Thức

```typescript
// Lấy giá từ target room product
sourceBasePrice = basePrice từ targetRoomProductId

// Áp dụng điều chỉnh
IF (adjustmentUnit === 'PERCENTAGE'):
    linkedBasePrice = sourceBasePrice × (1 + adjustmentValue / 100)
ELSE IF (adjustmentUnit === 'FIXED'):
    linkedBasePrice = sourceBasePrice + adjustmentValue
```

### Quy Trình

1. Lấy giá từ target room product (cùng rate plan)
2. Áp dụng adjustment
3. Tính giá cho linked product

### Điều Kiện

- `pricingMethod` = `LINK`
- Phải có `targetRoomProductId`
- Target product phải có giá

### Ví Dụ

```typescript
// Room Product A (Standard) = 100
// Room Product B (Deluxe) linked từ A với +20%

linkedBasePrice[B] = 100 × (1 + 20/100) = 120

// Room Product C (Suite) linked từ A với +50 (FIXED)
linkedBasePrice[C] = 100 + 50 = 150
```

---

## Bảng So Sánh Tổng Hợp

| Tiêu Chí | Feature | Average | Reversed | Attribute | Positioning | Derived | Link |
|----------|---------|---------|----------|-----------|-------------|---------|------|
| **Nguồn Dữ Liệu** | Retail Features | Related Products | Source Product | Related MRFCs/RFCs | Related RFCs + Occupancy | Target Rate Plan | Target Product |
| **Tính Toán** | Sum(feature × qty) | Average/Sum | Source + Adj | Max(MRFC) | Weighted Avg by Occ | Source + Adj | Source + Adj |
| **Adjustment** | ✓ (Daily) | ✓ | ✓ | - | ✓ (Optional) | ✓ | ✓ |
| **Dependency** | Features | Products | Mappings | Availability | Occupancy + Availability | Rate Plans | Products |
| **Dynamic** | Low | Low | Medium | High | Very High | Low | Low |
| **Complexity** | Low | Medium | Medium | High | Very High | Low | Low |
| **Use Case** | Base pricing | Multi-room | PMS sync | Dynamic RFC | Market-based MRFC | Rate strategies | Product variants |

---

## Điểm Chung

Tất cả phương pháp đều:

1. **Tính base price** theo công thức riêng
2. **Áp dụng adjustment** (FIXED hoặc PERCENTAGE):
   ```typescript
   finalPrice = calculatePriceAdjustment(basePrice, adjustmentValue, adjustmentUnit)
   ```
3. **Filter redundant inputs** - chỉ update khi giá thay đổi
4. **Calculate selling price** - tính giá bán cuối cùng (với tax, rounding, etc.)
5. **Insert to database** - lưu vào `RoomProductDailySellingPrice`

---

## Công Thức Chung: Price Adjustment

Được sử dụng bởi TẤT CẢ phương pháp:

```typescript
function calculatePriceAdjustment(
  basePrice: number, 
  adjustmentValue: number, 
  adjustmentUnit: 'PERCENTAGE' | 'FIXED'
): number {
  if (adjustmentUnit === 'PERCENTAGE') {
    return basePrice × (1 + adjustmentValue / 100)
  } else {
    return basePrice + adjustmentValue
  }
}
```

**File:** `src/core/helper/decimal-rounding.helper.ts:192-198`

---

## Quy Trình Tính Giá Bán Cuối Cùng

Sau khi có `basePrice` từ các phương pháp trên:

```typescript
// 1. Lấy base price
featureBasedRate = basePrice từ phương pháp tính

// 2. Áp dụng rate plan adjustment
adjustmentRate = dailyAdjustment ?? ratePlanAdjustment

IF (adjustmentType === 'FIXED'):
    adjustmentRate = adjustmentValue
ELSE IF (adjustmentType === 'PERCENTAGE'):
    adjustmentRate = featureBasedRate × (adjustmentValue / 100)

// 3. Tính accommodation rate
accommodationRate = featureBasedRate + adjustmentRate

// 4. Áp dụng rounding
roundedAccommodationRate = conditionalRounding(accommodationRate, roundingMode)

// 5. Tính tax
{netPrice, grossPrice, taxAmount} = calculateWithMultipleTaxRates(roundedAccommodationRate, taxes)

// 6. Lưu vào database
save {
  basePrice: featureBasedRate,
  netPrice,
  grossPrice,
  taxAmount,
  ratePlanAdjustments: adjustmentRate
}
```

**File:** `src/modules/room-product-rate-plan/room-product-selling-price/room-product-selling-price.service.ts:506-573`

---

## Kết Luận

### Ưu Điểm Từng Phương Pháp

1. **Feature Pricing**: Đơn giản, dễ cấu hình, phù hợp cho pricing cơ bản
2. **Average Pricing**: Tự động, phù hợp cho multi-room packages
3. **Reversed Pricing**: Đồng bộ với PMS, đảm bảo consistency
4. **Attribute Logic**: Tự động cập nhật RFC theo MRFC, phản ánh market
5. **Positioning**: Dynamic pricing theo demand, tối ưu revenue
6. **Derived**: Dễ quản lý rate strategies (BAR, Corporate, etc.)
7. **Link**: Dễ cấu hình product hierarchy (Standard → Deluxe → Suite)

### Nhược Điểm

1. **Feature**: Không dynamic, cần update manual
2. **Average**: Không phản ánh market conditions
3. **Reversed**: Phụ thuộc vào PMS data
4. **Attribute**: Chỉ work với RFC-MRFC relationship
5. **Positioning**: Phức tạp, cần accurate occupancy data
6. **Derived**: Limited flexibility trong adjustment
7. **Link**: Không phản ánh market changes

### Khuyến Nghị Sử Dụng

| Tình Huống | Phương Pháp | Lý Do |
|------------|-------------|-------|
| Small hotel, manual pricing | Feature | Đơn giản, dễ control |
| PMS integration | Reversed | Đồng bộ tự động |
| RFC pricing | Attribute | Theo market (MRFC) |
| MRFC pricing | Positioning | Theo demand (occupancy) |
| Rate plan strategies | Derived | Dễ quản lý hierarchy |
| Product variants | Link | Maintain consistency |
| Complex multi-room | Average | Tự động tính toán |

---

Generated: ${new Date().toISOString()}

