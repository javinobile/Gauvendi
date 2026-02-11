-- =====================================================
-- Duplicate Restrictions Check Script
-- =====================================================
-- This script identifies duplicate restrictions in the unified restriction table
-- and provides detailed reporting for validation after migration

-- 1. Check for exact duplicates (all fields match)
-- =====================================================
SELECT 
    'EXACT_DUPLICATES' as check_type,
    hotel_id,
    type,
    from_date,
    to_date,
    COALESCE(weekdays::text, 'NULL') as weekdays,
    COALESCE(room_product_ids::text, 'NULL') as room_product_ids,
    COALESCE(rate_plan_ids::text, 'NULL') as rate_plan_ids,
    COALESCE(min_length::text, 'NULL') as min_length,
    COALESCE(max_length::text, 'NULL') as max_length,
    COALESCE(min_adv::text, 'NULL') as min_adv,
    COALESCE(max_adv::text, 'NULL') as max_adv,
    COALESCE(min_los_through::text, 'NULL') as min_los_through,
    COALESCE(max_reservation_count::text, 'NULL') as max_reservation_count,
    COUNT(*) as duplicate_count,
    array_agg(id) as duplicate_ids
FROM public.restriction
GROUP BY 
    hotel_id, type, from_date, to_date, weekdays, room_product_ids, rate_plan_ids,
    min_length, max_length, min_adv, max_adv, min_los_through, max_reservation_count
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, hotel_id, type, from_date;

-- 2. Check for logical duplicates (same business logic)
-- =====================================================
-- This checks for restrictions that have the same effect but may differ in implementation details
SELECT 
    'LOGICAL_DUPLICATES' as check_type,
    hotel_id,
    type,
    from_date,
    to_date,
    COALESCE(room_product_ids::text, 'NULL') as room_product_ids,
    COALESCE(rate_plan_ids::text, 'NULL') as rate_plan_ids,
    COUNT(*) as duplicate_count,
    array_agg(id) as duplicate_ids,
    array_agg(DISTINCT COALESCE(min_length::text, 'NULL')) as min_length_values,
    array_agg(DISTINCT COALESCE(max_length::text, 'NULL')) as max_length_values,
    array_agg(DISTINCT COALESCE(min_adv::text, 'NULL')) as min_adv_values,
    array_agg(DISTINCT COALESCE(max_adv::text, 'NULL')) as max_adv_values
FROM public.restriction
GROUP BY 
    hotel_id, type, from_date, to_date, room_product_ids, rate_plan_ids
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, hotel_id, type, from_date;

-- 3. Check for overlapping date ranges with same targeting
-- =====================================================
-- This identifies restrictions that might conflict due to overlapping periods
WITH overlapping_restrictions AS (
    SELECT 
        r1.id as id1,
        r2.id as id2,
        r1.hotel_id,
        r1.type,
        r1.from_date as from_date1,
        r1.to_date as to_date1,
        r2.from_date as from_date2,
        r2.to_date as to_date2,
        r1.room_product_ids,
        r1.rate_plan_ids
    FROM public.restriction r1
    JOIN public.restriction r2 ON 
        r1.hotel_id = r2.hotel_id 
        AND r1.type = r2.type
        AND r1.id < r2.id  -- Avoid duplicating pairs
        AND (
            -- Same targeting (both null or same values)
            (r1.room_product_ids IS NULL AND r2.room_product_ids IS NULL) OR
            (r1.room_product_ids = r2.room_product_ids)
        )
        AND (
            (r1.rate_plan_ids IS NULL AND r2.rate_plan_ids IS NULL) OR
            (r1.rate_plan_ids = r2.rate_plan_ids)
        )
        AND (
            -- Date ranges overlap
            (r1.from_date IS NULL OR r2.to_date IS NULL OR r1.from_date <= r2.to_date) AND
            (r1.to_date IS NULL OR r2.from_date IS NULL OR r1.to_date >= r2.from_date)
        )
)
SELECT 
    'OVERLAPPING_DATES' as check_type,
    hotel_id,
    type,
    from_date1,
    to_date1,
    from_date2,
    to_date2,
    COALESCE(room_product_ids::text, 'NULL') as room_product_ids,
    COALESCE(rate_plan_ids::text, 'NULL') as rate_plan_ids,
    ARRAY[id1, id2] as conflicting_ids
FROM overlapping_restrictions
ORDER BY hotel_id, type, from_date1;

-- 4. Summary Report
-- =====================================================
SELECT 
    'SUMMARY_REPORT' as report_type,
    COUNT(*) as total_restrictions,
    COUNT(DISTINCT hotel_id) as unique_hotels,
    COUNT(DISTINCT type) as unique_types,
    SUM(CASE WHEN from_date IS NOT NULL AND to_date IS NOT NULL THEN 1 ELSE 0 END) as date_range_restrictions,
    SUM(CASE WHEN from_date IS NULL AND to_date IS NULL THEN 1 ELSE 0 END) as permanent_restrictions,
    SUM(CASE WHEN room_product_ids IS NOT NULL THEN 1 ELSE 0 END) as room_targeted_restrictions,
    SUM(CASE WHEN rate_plan_ids IS NOT NULL THEN 1 ELSE 0 END) as rate_targeted_restrictions
FROM public.restriction;

-- 5. Type Distribution Report
-- =====================================================
SELECT 
    'TYPE_DISTRIBUTION' as report_type,
    type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.restriction
GROUP BY type
ORDER BY count DESC;

-- 6. Hotel-wise Restriction Count
-- =====================================================
SELECT 
    'HOTEL_RESTRICTION_COUNT' as report_type,
    hotel_id,
    COUNT(*) as total_restrictions,
    COUNT(CASE WHEN type = 'ClosedToStay' THEN 1 END) as closed_to_stay,
    COUNT(CASE WHEN type = 'ClosedToArrival' THEN 1 END) as closed_to_arrival,
    COUNT(CASE WHEN type = 'ClosedToDeparture' THEN 1 END) as closed_to_departure
FROM public.restriction
GROUP BY hotel_id
ORDER BY total_restrictions DESC
LIMIT 20;  -- Top 20 hotels with most restrictions

-- 7. Check for Invalid Data
-- =====================================================
SELECT 
    'INVALID_DATA' as check_type,
    id,
    hotel_id,
    type,
    from_date,
    to_date,
    'Invalid date range: from_date > to_date' as issue
FROM public.restriction
WHERE from_date IS NOT NULL 
    AND to_date IS NOT NULL 
    AND from_date > to_date

UNION ALL

SELECT 
    'INVALID_DATA' as check_type,
    id,
    hotel_id,
    type,
    from_date,
    to_date,
    'Invalid min/max length: min_length > max_length' as issue
FROM public.restriction
WHERE min_length IS NOT NULL 
    AND max_length IS NOT NULL 
    AND min_length > max_length

UNION ALL

SELECT 
    'INVALID_DATA' as check_type,
    id,
    hotel_id,
    type,
    from_date,
    to_date,
    'Invalid min/max advance: min_adv > max_adv' as issue
FROM public.restriction
WHERE min_adv IS NOT NULL 
    AND max_adv IS NOT NULL 
    AND min_adv > max_adv

ORDER BY hotel_id, type, from_date;

-- 8. Migration Source Validation
-- =====================================================
-- Check if we have the expected number of records from each source table
-- Note: This requires manual comparison with source table counts

SELECT 
    'MIGRATION_VALIDATION' as report_type,
    'Expected vs Actual Record Count Check' as note,
    'Please compare these counts with source MariaDB tables:' as instruction,
    '' as blank_line,
    'hotel_restriction -> restrictions with room_product_ids IS NULL AND rate_plan_ids IS NULL' as mapping1,
    'rate_plan_restriction -> restrictions with rate_plan_ids IS NOT NULL AND from_date IS NULL' as mapping2,
    'rfc_restriction -> restrictions with room_product_ids IS NOT NULL AND from_date IS NULL' as mapping3,
    'rate_plan_restriction_adjustment -> restrictions with rate_plan_ids IS NOT NULL AND from_date IS NOT NULL' as mapping4,
    'rfc_restriction_adjustment -> restrictions with room_product_ids IS NOT NULL AND from_date IS NOT NULL' as mapping5;
