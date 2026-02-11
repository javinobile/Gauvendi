# Performance Analysis: Room Product Availability Queries

## Overview
This document outlines the performance optimizations implemented for room product availability queries, specifically focusing on the `calculateAvailabilityPerDateRaw` function.

## Current Query Performance

### Query Structure Analysis
The `calculateAvailabilityPerDateRaw` function uses a complex CTE-based query with the following structure:

```sql
WITH date_series AS (
  SELECT generate_series($1::date, $2::date, '1 day'::interval)::date::text as date
),
product_dates AS (
  SELECT ds.date, rp.id as room_product_id
  FROM date_series ds
  CROSS JOIN (SELECT unnest($3::uuid[]) as id) rp
),
availability_check AS (
  SELECT pd.date, pd.room_product_id,
    CASE 
      WHEN rda.id IS NULL THEN false
      WHEN (COALESCE(rda.sell_limit, 0) + COALESCE(rda.adjustment, 0)) - COALESCE(rda.sold, 0) > 0 THEN true
      WHEN COALESCE(rda.available, 0) > 0 THEN true
      ELSE false
    END as has_availability
  FROM product_dates pd
  LEFT JOIN room_product_daily_availability rda 
    ON rda.room_product_id = pd.room_product_id 
    AND rda.date = pd.date
    AND rda.hotel_id = $4
)
SELECT date, COUNT(*) FILTER (WHERE has_availability = true) as available_products_count
FROM availability_check
GROUP BY date
ORDER BY date
```

## Existing Indexes

### Current Indexes on `room_product_daily_availability`:
1. **Primary Key**: `id` (uuid)
2. **Unique Composite**: `(hotel_id, room_product_id, date)` - IDX_89256677b62dd7f7e15629ca08
3. **Single Column**: `room_product_id` - IDX_36c62333a804768f70a35604bd

### Current Indexes on `room_product`:
1. **Unique Composite**: `(hotel_id, code)`
2. **Composite**: `(hotel_id, distribution_channel)`
3. **Composite**: `(hotel_id, type, status)`
4. **Capacity Composite**: `(hotel_id, type, status, maximum_adult, maximum_kid, maximum_pet)` ✅ **Recently Added**

## Performance Bottlenecks Identified

### 1. Date Range Queries
- **Issue**: The LEFT JOIN on `room_product_daily_availability` with date filtering can be slow for large date ranges
- **Impact**: O(n × m) where n = number of products, m = number of days

### 2. Availability Calculation
- **Issue**: Complex CASE statement with multiple COALESCE operations on each row
- **Impact**: CPU-intensive calculations on potentially large result sets

### 3. Index Coverage
- **Issue**: Current indexes don't fully cover the query pattern used in the CTE
- **Impact**: Index scans may require additional table lookups

## Implemented Optimizations

### 1. New Composite Indexes

#### A. Hotel-Date-Product Index
```sql
CREATE INDEX "IDX_room_product_daily_availability_hotel_date_product" 
ON "room_product_daily_availability" ("hotel_id", "date", "room_product_id")
```
**Purpose**: Optimizes the LEFT JOIN condition in the availability_check CTE
**Benefits**: 
- Faster lookups for hotel + date range queries
- Supports efficient date range scans
- Reduces random I/O for product filtering

#### B. Date-Hotel Index  
```sql
CREATE INDEX "IDX_room_product_daily_availability_date_hotel" 
ON "room_product_daily_availability" ("date", "hotel_id")
```
**Purpose**: Alternative access path for date-first queries
**Benefits**:
- Efficient when date selectivity is high
- Supports date range queries across multiple hotels
- Complements the hotel-date-product index

#### C. Covering Index
```sql
CREATE INDEX "IDX_room_product_daily_availability_covering" 
ON "room_product_daily_availability" ("hotel_id", "room_product_id", "date") 
INCLUDE ("sell_limit", "adjustment", "sold", "available")
```
**Purpose**: Index-only scans for availability calculations
**Benefits**:
- Eliminates table lookups for availability data
- All required columns available in index
- Significant I/O reduction for large result sets

### 2. Query Optimization Features

#### A. CTE Usage
- **Benefit**: Better query planning and optimization
- **Impact**: PostgreSQL can optimize each CTE independently
- **Result**: More predictable execution plans

#### B. FILTER Clause
- **Benefit**: Efficient conditional aggregation
- **Impact**: Single pass aggregation instead of multiple queries
- **Compatibility**: PostgreSQL 9.4+

#### C. generate_series for Date Ranges
- **Benefit**: Eliminates application-side date generation
- **Impact**: Reduces memory usage and network traffic
- **Result**: Database-native date series generation

## Performance Expectations

### Before Optimization
- **Query Type**: Multiple index scans + table lookups
- **I/O Pattern**: Random reads for availability data
- **Complexity**: O(n × m × log(k)) where k = table size

### After Optimization  
- **Query Type**: Index-only scans (when possible)
- **I/O Pattern**: Sequential index reads
- **Complexity**: O(n × m) with much lower constant factors

### Expected Improvements
1. **50-80% reduction** in query execution time for typical date ranges (7-30 days)
2. **60-90% reduction** in I/O operations through covering indexes
3. **Improved scalability** for larger room product sets (100+ products)
4. **Better cache utilization** due to index-only access patterns

## Monitoring and Validation

### Key Metrics to Monitor
1. **Query execution time** - Target: <100ms for 30-day ranges
2. **Index usage** - Verify new indexes are being used via EXPLAIN ANALYZE
3. **I/O statistics** - Monitor buffer hits vs reads
4. **Cache hit ratio** - Should improve with covering indexes

### Validation Queries
```sql
-- Check index usage
EXPLAIN (ANALYZE, BUFFERS) 
SELECT /* your query here */;

-- Monitor index statistics
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'room_product_daily_availability';
```

## Migration Strategy

### Deployment Steps
1. **Apply migration**: Run `OptimizeAvailabilityQueryIndexes1756353660912`
2. **Monitor performance**: Check query execution times
3. **Validate indexes**: Ensure new indexes are being used
4. **Rollback plan**: Migration includes proper DOWN methods

### Index Maintenance
- **Size impact**: Expect ~20-30% increase in table size due to additional indexes
- **Write performance**: Minimal impact on INSERTs/UPDATEs (typically <5% overhead)
- **Maintenance**: Indexes will be maintained automatically by PostgreSQL

## Conclusion

The implemented optimizations provide comprehensive performance improvements for room product availability queries through:

1. **Strategic indexing** covering all major query patterns
2. **Covering indexes** eliminating table lookups
3. **Query structure optimization** using CTEs and modern PostgreSQL features

These changes should significantly improve response times for availability calendar queries while maintaining data consistency and system reliability.
