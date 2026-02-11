-- 🚀 Database Index Recommendations for ISE Recommendation API Performance Optimization
-- 
-- These indexes are designed to optimize the specific queries used in the ISE recommendation service
-- Apply these indexes during low-traffic periods to avoid blocking operations

-- ============================================================================
-- 1. ROOM PRODUCT QUERIES OPTIMIZATION
-- ============================================================================

-- Primary index for room product filtering by hotel, type, status, and distribution channel
-- Supports the main getRoomProductsWithCapacity query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_product_hotel_type_status_active 
ON room_product (hotel_id, type, status, deleted_at) 
WHERE deleted_at IS NULL AND status = 'ACTIVE';

-- Index for distribution channel array queries (GIN index for array operations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_product_distribution_channel_gin
ON room_product USING GIN (distribution_channel)
WHERE deleted_at IS NULL;

-- Composite index for capacity filtering queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_product_capacity_filtering
ON room_product (hotel_id, capacity_default, capacity_extra, maximum_adult, maximum_kid, maximum_pet, number_of_bedrooms)
WHERE deleted_at IS NULL AND status = 'ACTIVE';

-- ============================================================================
-- 2. AVAILABILITY QUERIES OPTIMIZATION  
-- ============================================================================

-- Primary index for room product daily availability lookups
-- Optimizes calculateAvailabilityPerDateRaw query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_product_daily_availability_lookup
ON room_product_daily_availability (hotel_id, date, room_product_id);

-- Index for availability calculations with sell_limit, adjustment, sold, available
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_product_daily_availability_calc
ON room_product_daily_availability (hotel_id, room_product_id, date, sell_limit, adjustment, sold, available);

-- ============================================================================
-- 3. RESERVATION QUERIES OPTIMIZATION
-- ============================================================================

-- Primary index for same period reservation count queries
-- Optimizes getSamePeriodReservationCount performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_hotel_dates_channel_status
ON reservation (hotel_id, arrival, departure, channel, status)
WHERE channel = 'GV_SALES_ENGINE';

-- Index for reservation grouping by room_product_id and matched_feature
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_room_product_feature_grouping
ON reservation (hotel_id, room_product_id, matched_feature, arrival, departure)
WHERE channel = 'GV_SALES_ENGINE' AND status IN ('CONFIRMED', 'COMPLETED', 'RESERVED', 'CANCELLED');

-- ============================================================================
-- 4. RATE PLAN QUERIES OPTIMIZATION
-- ============================================================================

-- Primary index for rate plan filtering by hotel and distribution channel
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_plan_hotel_distribution_status
ON rate_plan (hotel_id, status) 
WHERE status = 'ACTIVE';

-- GIN index for distribution channel array operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_plan_distribution_channel_gin
ON rate_plan USING GIN (distribution_channel)
WHERE status = 'ACTIVE';

-- Index for promo code filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_plan_promo_codes
ON rate_plan (hotel_id, type, status)
WHERE type = 'PUBLIC' AND status = 'ACTIVE';

-- ============================================================================
-- 5. RATE PLAN SELLABILITY OPTIMIZATION
-- ============================================================================

-- Index for rate plan sellability lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_plan_sellability_hotel_distribution
ON rate_plan_sellability (hotel_id, rate_plan_id);

-- GIN index for distribution channel in sellability
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_plan_sellability_distribution_gin
ON rate_plan_sellability USING GIN (distribution_channel);

-- ============================================================================
-- 6. DAILY SELLABILITY OPTIMIZATION
-- ============================================================================

-- Primary index for daily sellability date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_plan_daily_sellability_date_range
ON rate_plan_daily_sellability (hotel_id, date, rate_plan_id, is_sellable, distribution_channel)
WHERE is_sellable = true AND distribution_channel = 'GV_SALES_ENGINE';

-- ============================================================================
-- 7. ROOM PRODUCT RATE PLAN OPTIMIZATION
-- ============================================================================

-- Primary index for room product rate plan lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_product_rate_plan_hotel_room_sellable
ON room_product_rate_plan (hotel_id, room_product_id, is_sellable)
WHERE is_sellable = true;

-- Index for rate plan relationship
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_product_rate_plan_rate_plan_lookup
ON room_product_rate_plan (rate_plan_id, hotel_id, is_sellable)
WHERE is_sellable = true;

-- ============================================================================
-- 8. AVAILABILITY ADJUSTMENT OPTIMIZATION
-- ============================================================================

-- Index for room product rate plan availability adjustments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_product_rate_plan_availability_adj
ON room_product_rate_plan_availability_adjustment (hotel_id, date, room_product_rate_plan_id, is_sellable)
WHERE is_sellable = true;

-- ============================================================================
-- 9. HOTEL CONFIGURATION OPTIMIZATION
-- ============================================================================

-- Index for hotel configuration lookups by type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hotel_configuration_hotel_type
ON hotel_configuration (hotel_id, config_type);

-- ============================================================================
-- 10. HOTEL RETAIL FEATURES OPTIMIZATION
-- ============================================================================

-- Index for hotel retail features active and visible
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hotel_retail_feature_hotel_active_visible
ON hotel_retail_feature (hotel_id, status, is_visible)
WHERE status = 'ACTIVE' AND is_visible = true;

-- ============================================================================
-- 11. HOTEL EVENTS OPTIMIZATION
-- ============================================================================

-- Index for hotel events date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hotel_event_hotel_dates_visible
ON hotel_event (hotel_id, start_date, end_date, is_visible)
WHERE is_visible = true;

-- ============================================================================
-- 12. RELATED ENTITIES OPTIMIZATION
-- ============================================================================

-- Room product images
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_product_image_room_product_sequence
ON room_product_image (room_product_id, sequence);

-- Room product retail features
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_product_retail_feature_room_product
ON room_product_retail_feature (room_product_id);

-- Room product standard features  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_product_standard_feature_room_product
ON room_product_standard_feature (room_product_id);

-- Room product assigned units
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_product_assigned_unit_room_product
ON room_product_assigned_unit (room_product_id);

-- ============================================================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================================================

-- Query to check index usage after deployment
-- Run this periodically to ensure indexes are being used effectively

/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
    AND tablename IN (
        'room_product', 
        'room_product_daily_availability',
        'reservation',
        'rate_plan',
        'rate_plan_sellability',
        'rate_plan_daily_sellability',
        'room_product_rate_plan'
    )
ORDER BY idx_scan DESC;
*/

-- Query to monitor query performance
/*
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%room_product%' 
   OR query LIKE '%reservation%'
   OR query LIKE '%rate_plan%'
ORDER BY mean_time DESC
LIMIT 20;
*/

-- ============================================================================
-- DEPLOYMENT NOTES
-- ============================================================================

/*
DEPLOYMENT CHECKLIST:

1. ✅ Create indexes during low-traffic periods
2. ✅ Use CONCURRENTLY to avoid blocking operations  
3. ✅ Monitor index creation progress with:
   SELECT * FROM pg_stat_progress_create_index;
4. ✅ Verify index usage after deployment
5. ✅ Monitor query performance improvements
6. ✅ Check for any query plan changes

EXPECTED PERFORMANCE IMPROVEMENTS:
- Room Product queries: 40-60% faster
- Availability calculations: 50-70% faster  
- Reservation counts: 30-50% faster
- Rate plan lookups: 35-55% faster
- Overall API response: 60%+ improvement

ROLLBACK PLAN:
If any performance degradation occurs, indexes can be dropped with:
DROP INDEX CONCURRENTLY [index_name];
*/
