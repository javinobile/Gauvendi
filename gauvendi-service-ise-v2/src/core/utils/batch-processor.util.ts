import { from, lastValueFrom } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Logger } from '@nestjs/common';

export interface BatchProcessorOptions {
  batchSize: number;
  delayMs: number;
  maxRetries?: number;
  retryDelayMs?: number;
  exponentialBackoff?: boolean;
  ignore429?: boolean;
  onRetry?: (error: any, attempt: number, item: any) => void;
  onError?: (error: any, item: any) => void;
}

export interface BatchProcessorResult<R> {
  results: R[];
  errors: Array<{ item: any; error: any }>;
  totalProcessed: number;
  totalErrors: number;
}

// Enhanced utility function to process items in batches with 429 error handling
export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  delayMs: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const result = await processInBatchesWithOptions(items, {
    batchSize,
    delayMs,
    ignore429: true,
    maxRetries: 3
  }, processor);
  
  return result.results;
}

// Enhanced batch processor with comprehensive error handling
export async function processInBatchesWithOptions<T, R>(
  items: T[],
  options: BatchProcessorOptions,
  processor: (item: T) => Promise<R>
): Promise<BatchProcessorResult<R>> {
  const logger = new Logger('BatchProcessor');
  const results: R[] = [];
  const errors: Array<{ item: T; error: any }> = [];
  
  const {
    batchSize,
    delayMs,
    maxRetries = 3,
    retryDelayMs = 1000,
    exponentialBackoff = true,
    ignore429 = true,
    onRetry,
    onError
  } = options;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    logger.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)} (${batch.length} items)`);

    // Process batch items with individual retry logic
    const batchPromises = batch.map(async (item) => {
      return await processItemWithRetry(item, processor, {
        maxRetries,
        retryDelayMs,
        exponentialBackoff,
        ignore429,
        onRetry,
        onError,
        logger
      });
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    // Process batch results
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success && result.value.data !== undefined) {
        results.push(result.value.data);
      } else {
        const item = batch[index];
        const error = result.status === 'rejected' ? result.reason : result.value.error;
        errors.push({ item, error });
        
        if (onError) {
          onError(error, item);
        }
      }
    });

    // Add delay between batches (except for the last batch)
    if (i + batchSize < items.length) {
      await lastValueFrom(from([null]).pipe(delay(delayMs)));
    }
  }

  logger.log(`Batch processing completed. Processed: ${results.length}, Errors: ${errors.length}`);
  
  return {
    results,
    errors,
    totalProcessed: results.length,
    totalErrors: errors.length
  };
}

// Process individual item with retry logic for 429 errors
async function processItemWithRetry<T, R>(
  item: T,
  processor: (item: T) => Promise<R>,
  options: {
    maxRetries: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
    ignore429: boolean;
    onRetry?: (error: any, attempt: number, item: any) => void;
    onError?: (error: any, item: any) => void;
    logger: Logger;
  }
): Promise<{ success: boolean; data?: R; error?: any }> {
  const { maxRetries, retryDelayMs, exponentialBackoff, ignore429, onRetry, logger } = options;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await processor(item);
      return { success: true, data: result };
    } catch (error) {
      const is429Error = is429RateLimitError(error);
      const shouldRetry = attempt <= maxRetries && (ignore429 ? is429Error : true);
      
      if (!shouldRetry) {
        logger.error(`Failed to process item after ${attempt - 1} retries:`, error);
        return { success: false, error };
      }
      
      if (is429Error) {
        const retryAfter = getRetryAfterDelay(error);
        const backoffDelay = exponentialBackoff 
          ? Math.min(retryDelayMs * Math.pow(2, attempt - 1), 30000) // Max 30 seconds
          : retryDelayMs;
        const finalDelay = retryAfter || backoffDelay;
        
        logger.warn(`Rate limited (429), retrying in ${finalDelay}ms (attempt ${attempt}/${maxRetries + 1})`);
        
        if (onRetry) {
          onRetry(error, attempt, item);
        }
        
        await lastValueFrom(from([null]).pipe(delay(finalDelay)));
      } else if (ignore429) {
        // If we're only ignoring 429 errors, don't retry other errors
        logger.error(`Non-429 error encountered, not retrying:`, error);
        return { success: false, error };
      } else {
        // Retry all errors
        const backoffDelay = exponentialBackoff 
          ? Math.min(retryDelayMs * Math.pow(2, attempt - 1), 30000)
          : retryDelayMs;
        
        logger.warn(`Error encountered, retrying in ${backoffDelay}ms (attempt ${attempt}/${maxRetries + 1}):`, error);
        
        if (onRetry) {
          onRetry(error, attempt, item);
        }
        
        await lastValueFrom(from([null]).pipe(delay(backoffDelay)));
      }
    }
  }
  
  return { success: false, error: new Error('Max retries exceeded') };
}

// Check if error is a 429 rate limit error
function is429RateLimitError(error: any): boolean {
  // Check for HTTP 429 status code in various error formats
  if (error?.response?.status === 429) return true;
  if (error?.status === 429) return true;
  if (error?.code === 429) return true;
  if (error?.statusCode === 429) return true;
  
  // Check for rate limit keywords in error message
  const errorMessage = (error?.message || error?.toString() || '').toLowerCase();
  const rateLimitKeywords = [
    'rate limit',
    'too many requests',
    'quota exceeded',
    'throttled',
    'rate exceeded'
  ];
  
  return rateLimitKeywords.some(keyword => errorMessage.includes(keyword));
}

// Extract retry-after delay from error response
function getRetryAfterDelay(error: any): number | null {
  // Check for Retry-After header (in seconds)
  const retryAfterHeader = error?.response?.headers?.['retry-after'] || 
                          error?.headers?.['retry-after'];
  
  if (retryAfterHeader) {
    const retryAfterSeconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(retryAfterSeconds)) {
      return retryAfterSeconds * 1000; // Convert to milliseconds
    }
  }
  
  // Check for rate limit reset time
  const rateLimitReset = error?.response?.headers?.['x-ratelimit-reset'] ||
                        error?.headers?.['x-ratelimit-reset'];
  
  if (rateLimitReset) {
    const resetTime = parseInt(rateLimitReset, 10);
    if (!isNaN(resetTime)) {
      const now = Math.floor(Date.now() / 1000);
      const delaySeconds = Math.max(resetTime - now, 1);
      return delaySeconds * 1000; // Convert to milliseconds
    }
  }
  
  return null;
}

// Utility function for processing with rate limiting specifically for APIs
export async function processWithRateLimit<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    requestsPerSecond?: number;
    burstLimit?: number;
    maxRetries?: number;
  } = {}
): Promise<BatchProcessorResult<R>> {
  const {
    requestsPerSecond = 10,
    burstLimit = 20,
    maxRetries = 5
  } = options;
  
  // Calculate batch size and delay based on rate limits
  const batchSize = Math.min(burstLimit, Math.ceil(requestsPerSecond / 2));
  const delayMs = Math.ceil(1000 / requestsPerSecond) * batchSize;
  
  return processInBatchesWithOptions(items, {
    batchSize,
    delayMs,
    maxRetries,
    retryDelayMs: 2000,
    exponentialBackoff: true,
    ignore429: true,
    onRetry: (error, attempt, item) => {
      const logger = new Logger('RateLimitProcessor');
      logger.warn(`Retrying rate-limited request (attempt ${attempt})`);
    }
  }, processor);
}
