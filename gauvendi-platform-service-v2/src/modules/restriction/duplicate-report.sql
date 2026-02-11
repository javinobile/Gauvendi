-- =====================================================
-- Duplicate Restrictions Report
-- Simple report showing duplicates by type, from_date, to_date
-- =====================================================

-- Main duplicate check query
SELECT 
    type,
    from_date,
    to_date,
    hotel_id,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as duplicate_ids,
    STRING_AGG(
        CASE 
            WHEN room_product_ids IS NOT NULL THEN 'ROOM_TARGETED'
            WHEN rate_plan_ids IS NOT NULL THEN 'RATE_TARGETED'
            ELSE 'HOTEL_LEVEL'
        END, 
        ', '
    ) as targeting_types,
    STRING_AGG(
        COALESCE(room_product_ids::text, 'NULL'), 
        ' | '
    ) as room_products,
    STRING_AGG(
        COALESCE(rate_plan_ids::text, 'NULL'), 
        ' | '
    ) as rate_plans
FROM public.restriction
GROUP BY 
    type, 
    from_date, 
    to_date,
    hotel_id
HAVING COUNT(*) > 1
ORDER BY 
    duplicate_count DESC, 
    hotel_id,
    type, 
    from_date NULLS LAST,
    to_date NULLS LAST;

-- Summary of duplicates by type
SELECT 
    '--- DUPLICATE SUMMARY BY TYPE ---' as section_header,
    type,
    COUNT(*) as groups_with_duplicates,
    SUM(duplicate_count) as total_duplicate_records,
    AVG(duplicate_count) as avg_duplicates_per_group
FROM (
    SELECT 
        type,
        COUNT(*) as duplicate_count
    FROM public.restriction
    GROUP BY 
        type, 
        from_date, 
        to_date,
        hotel_id
    HAVING COUNT(*) > 1
) duplicates_by_type
GROUP BY type
ORDER BY total_duplicate_records DESC;

-- Quick count check
SELECT 
    '--- QUICK STATS ---' as section_header,
    COUNT(*) as total_restrictions,
    COUNT(DISTINCT (type, from_date, to_date, hotel_id)) as unique_combinations,
    COUNT(*) - COUNT(DISTINCT (type, from_date, to_date, hotel_id)) as potential_duplicates
FROM public.restriction;
