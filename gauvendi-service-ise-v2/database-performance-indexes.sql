-- Performance Optimization Indexes for Room Product Sellability API
-- These indexes will significantly improve query performance

-- 1. RoomProductDailyBasePrice table indexes
CREATE INDEX IF NOT EXISTS idx_room_product_daily_base_price_composite 
ON room_product_daily_base_price (property_id, room_product_id, sales_plan_id, date, soft_delete);

CREATE INDEX IF NOT EXISTS idx_room_product_daily_base_price_date_range 
ON room_product_daily_base_price (property_id, date, soft_delete) 
WHERE soft_delete = false;

-- 2. RatePlanAdjustment table indexes
CREATE INDEX IF NOT EXISTS idx_rate_plan_adjustment_composite 
ON rate_plan_adjustment (hotel_id, rate_plan_id, date, soft_delete);

CREATE INDEX IF NOT EXISTS idx_rate_plan_adjustment_batch 
ON rate_plan_adjustment (hotel_id, date, soft_delete) 
WHERE soft_delete = false;

-- 3. SalesPlanSellability table indexes
CREATE INDEX IF NOT EXISTS idx_sales_plan_sellability_composite 
ON sales_plan_sellability (property_id, sales_plan_id, distribution_channel, soft_delete);

-- 4. SalesPlanSellabilityAdjustment table indexes
CREATE INDEX IF NOT EXISTS idx_sales_plan_sellability_adjustment_composite 
ON sales_plan_sellability_adjustment (property_id, sales_plan_id, distribution_channel, date, soft_delete);

CREATE INDEX IF NOT EXISTS idx_sales_plan_sellability_adjustment_date_range 
ON sales_plan_sellability_adjustment (property_id, date, soft_delete) 
WHERE soft_delete = false;

-- 5. RfcRatePlan table indexes
CREATE INDEX IF NOT EXISTS idx_rfc_rate_plan_composite 
ON rfc_rate_plan (hotel_id, rfc_id, soft_delete);

-- 6. RfcRatePlanAvailabilityAdjustment table indexes
CREATE INDEX IF NOT EXISTS idx_rfc_rate_plan_availability_adjustment_composite 
ON rfc_rate_plan_availability_adjustment (hotel_id, rfc_rate_plan_id, date, soft_delete);

-- 7. RoomProductDailySellingPrice table indexes
CREATE INDEX IF NOT EXISTS idx_room_product_daily_selling_price_composite 
ON room_product_daily_selling_price (property_id, room_product_id, sales_plan_id, date, soft_delete);

-- 8. Hotel tax and amenity tables (for caching optimization)
CREATE INDEX IF NOT EXISTS idx_hotel_tax_setting_hotel_id 
ON hotel_tax_setting (hotel_id, soft_delete) 
WHERE soft_delete = false;

CREATE INDEX IF NOT EXISTS idx_hotel_city_tax_v2_hotel_id 
ON hotel_city_tax_v2 (hotel_id, soft_delete) 
WHERE soft_delete = false;

CREATE INDEX IF NOT EXISTS idx_hotel_amenity_price_hotel_id 
ON hotel_amenity_price (hotel_id, soft_delete) 
WHERE soft_delete = false;

-- Performance monitoring queries to check index usage
-- Run these after implementing to verify indexes are being used:

-- EXPLAIN ANALYZE SELECT * FROM room_product_daily_base_price 
-- WHERE property_id = 'GV310786' 
-- AND room_product_id IN ('room1', 'room2') 
-- AND sales_plan_id IN ('plan1', 'plan2') 
-- AND date BETWEEN '2025-08-25' AND '2025-09-31' 
-- AND soft_delete = false;

-- EXPLAIN ANALYZE SELECT * FROM rate_plan_adjustment 
-- WHERE hotel_id = 'GV310786' 
-- AND rate_plan_id IN ('plan1', 'plan2') 
-- AND date BETWEEN '2025-08-25' AND '2025-09-31' 
-- AND soft_delete = false;
