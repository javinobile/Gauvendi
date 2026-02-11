# Recommendation Algorithm - Python to TypeScript Conversion

## Overview

This document describes the conversion of a Python-based room recommendation algorithm to TypeScript/NestJS. The algorithm is designed for hotel booking systems to find optimal room combinations based on various scoring criteria and constraints.

## Files Created

### 1. `recommendation-algorithm.types.ts`
Contains all TypeScript interfaces and type definitions:
- `BookingHistoryItem` - Historical booking data structure
- `CapacityItem` - Room capacity and availability data
- `RoomProductAvailable` - Room product availability information
- `CombinationResult` - Result structure for room combinations
- `BestCombinations` - Structure for storing optimal combinations
- Custom error classes: `ProcessExecuteError`, `ValueEmptyException`

### 2. `recommendation-algorithm.utils.ts`
Utility functions converted from Python:
- `calculateMinMaxScore()` - Min/max normalization scoring
- `calculateDirectScore()` - Direct scoring calculation
- `calculateMostPopularScore()` - Popularity-based scoring
- `checkRoomAvailability()` - Room availability validation
- `checkRestricted()` - Restriction checking
- `prepareDataStructures()` - Data preparation for optimization
- Various helper functions for data manipulation

### 3. `recommendation-algorithm.service.ts`
Main service class containing the core algorithms:
- `getPopularProductWithPipeline()` - Product popularity scoring
- `multipleRoomTotalScoreWithCodeOptimized()` - Combination scoring
- `runOptimization()` - Recursive optimization algorithm
- `multipleRoomPipeline()` - Main pipeline processing

## Key Conversion Changes

### 1. Data Structures
- **Python pandas DataFrames** → **TypeScript arrays of objects**
- **Python dictionaries** → **TypeScript Map objects and interfaces**
- **Python Counter** → **Custom counter function using Map**

### 2. Algorithm Optimizations
- **Recursive backtracking** maintained the same logic structure
- **Global variables** converted to class instance variables
- **Memory management** improved with explicit cleanup methods

### 3. Error Handling
- **Python exceptions** → **Custom TypeScript error classes**
- **Try-catch blocks** maintained similar structure
- **Logging** converted to NestJS Logger

### 4. Environment Variables
- **Python os.getenv()** → **process.env with type-safe getEnv() utility**

## Usage Example

```typescript
import { RecommendationAlgorithmService } from './recommendation-algorithm.service';

@Injectable()
export class YourService {
  constructor(
    private readonly recommendationService: RecommendationAlgorithmService,
  ) {}

  async findOptimalRooms() {
    const saleStrategy = ['direct', 'mostPopular'];
    const topMatchDfs = [/* your data */];
    const roomProductAvailable = [/* availability data */];
    const mrfcAvailability = [/* MRFC data */];
    
    const results = await this.recommendationService.multipleRoomPipeline(
      saleStrategy,
      topMatchDfs,
      roomProductAvailable,
      mrfcAvailability,
      [], // exclude combinations
      [], // exclude base prices
      ['single', 'double'], // space types
      null, // matched codes
      'mostPopularScore'
    );
    
    return results;
  }
}
```

## Configuration

Environment variables (same as Python version):
- `LIMIT_MOST_POPULAR` (default: 10)
- `LIMIT_OUR_TIP` (default: 2)
- `LIMIT_MATCHING` (default: 12)
- `LIMIT_DIRECT` (default: 300)
- `MAX_COMBINATIONS` (default: 1000000)

## Performance Considerations

### Optimizations Implemented:
1. **Early termination** in recursive algorithms
2. **Constraint checking** to prune invalid combinations
3. **Memory cleanup** to prevent leaks
4. **Efficient data structures** using Maps and Sets

### Scaling Considerations:
- The algorithm uses recursive backtracking which can be computationally intensive
- Large combination spaces are handled with the `MAX_COMBINATIONS` limit
- Memory usage is optimized through proper cleanup of global variables

## Algorithm Flow

1. **Data Preparation**: Filter and merge capacity and booking history data
2. **Score Calculation**: Compute various normalized scores (popularity, history, capacity)
3. **Combination Generation**: Generate all possible room combinations
4. **Constraint Validation**: Apply business rules and availability checks
5. **Optimization**: Use recursive backtracking to find optimal solutions
6. **Result Filtering**: Remove duplicates and apply final constraints
7. **Sorting**: Order results by restriction status and score

## Testing Recommendations

1. **Unit Tests**: Test individual scoring functions with known inputs
2. **Integration Tests**: Test the full pipeline with sample data
3. **Performance Tests**: Validate algorithm performance with large datasets
4. **Edge Case Tests**: Test with empty data, single rooms, maximum constraints

## Migration Notes

### Differences from Python Version:
1. **Type Safety**: All data structures are now type-safe
2. **Memory Management**: Explicit cleanup methods prevent memory leaks
3. **Error Handling**: More structured error handling with custom exceptions
4. **Logging**: Integrated with NestJS logging system
5. **Dependency Injection**: Service can be easily injected into other components

### Potential Issues:
1. **Floating Point Precision**: JavaScript number precision may differ slightly from Python
2. **Array Sorting**: Ensure consistent sorting behavior across platforms
3. **Memory Usage**: Monitor memory usage with large datasets

## Dependencies

The converted code only requires:
- `@nestjs/common` (for Injectable, Logger)
- Standard TypeScript/JavaScript (no external libraries needed)

This makes it much lighter than the Python version which required numpy, pandas, and other scientific computing libraries.
