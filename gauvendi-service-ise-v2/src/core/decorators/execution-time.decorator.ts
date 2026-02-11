import { Logger } from '@nestjs/common';

/**
 * Decorator to log execution time of methods
 * @param loggerName - Optional logger name, defaults to class name
 * @param logLevel - Log level: 'log' | 'debug' | 'verbose' | 'warn' | 'error'
 */
export function LogExecutionTime(
  loggerName?: string,
  logLevel: 'log' | 'debug' | 'verbose' | 'warn' | 'error' = 'log'
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;
    const logger = new Logger(loggerName || className);

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const methodName = `${className}.${propertyName}`;
      
      try {
        // Log method start
        logger[logLevel](`🚀 [${methodName}] Started`);
        
        // Execute the original method
        const result = await method.apply(this, args);
        
        // Calculate execution time
        const executionTime = Date.now() - startTime;
        
        // Log successful completion
        logger[logLevel](`✅ [${methodName}] Completed in ${executionTime}ms`);
        
        return result;
      } catch (error) {
        // Calculate execution time even for errors
        const executionTime = Date.now() - startTime;
        
        // Log error with execution time
        logger.error(`❌ [${methodName}] Failed after ${executionTime}ms - Error: ${error.message}`);
        
        // Re-throw the error
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator to log execution time with detailed performance metrics
 * @param options - Configuration options
 */
export function LogPerformance(options?: {
  loggerName?: string;
  logLevel?: 'log' | 'debug' | 'verbose' | 'warn' | 'error';
  includeArgs?: boolean;
  includeResult?: boolean;
  slowThreshold?: number; // Log as warning if execution time exceeds this (ms)
}) {
  const {
    loggerName,
    logLevel = 'log',
    includeArgs = false,
    includeResult = false,
    slowThreshold = 1000
  } = options || {};

  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;
    const logger = new Logger(loggerName || className);

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const methodName = `${className}.${propertyName}`;
      
      // Log method start with args if requested
      const startMessage = includeArgs 
        ? `🚀 [${methodName}] Started with args: ${JSON.stringify(args, null, 2)}`
        : `🚀 [${methodName}] Started`;
      
      logger[logLevel](startMessage);
      
      try {
        // Execute the original method
        const result = await method.apply(this, args);
        
        // Calculate execution time
        const executionTime = Date.now() - startTime;
        
        // Determine log level based on execution time
        const finalLogLevel = executionTime > slowThreshold ? 'warn' : logLevel;
        
        // Create completion message
        let completionMessage = `✅ [${methodName}] Completed in ${executionTime}ms`;
        
        if (executionTime > slowThreshold) {
          completionMessage += ` ⚠️ (Slow execution - threshold: ${slowThreshold}ms)`;
        }
        
        if (includeResult) {
          completionMessage += `\nResult: ${JSON.stringify(result, null, 2)}`;
        }
        
        logger[finalLogLevel](completionMessage);
        
        return result;
      } catch (error) {
        // Calculate execution time even for errors
        const executionTime = Date.now() - startTime;
        
        // Log error with execution time
        logger.error(`❌ [${methodName}] Failed after ${executionTime}ms - Error: ${error.message}`);
        logger.error(`Stack trace: ${error.stack}`);
        
        // Re-throw the error
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Simple decorator for quick execution time logging
 */
export function Timed(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  return LogExecutionTime()(target, propertyName, descriptor);
}

/**
 * Decorator specifically for database operations
 */
export function LogDbOperation(operationType?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;
    const logger = new Logger(`${className}:DB`);

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const operation = operationType || propertyName;
      const methodName = `${className}.${propertyName}`;
      
      logger.debug(`🗄️ [DB:${operation}] ${methodName} - Starting database operation`);
      
      try {
        const result = await method.apply(this, args);
        const executionTime = Date.now() - startTime;
        
        // Log as warning if DB operation is slow (>500ms)
        const logLevel = executionTime > 500 ? 'warn' : 'debug';
        const slowWarning = executionTime > 500 ? ' ⚠️ SLOW DB OPERATION' : '';
        
        logger[logLevel](`🗄️ [DB:${operation}] ${methodName} - Completed in ${executionTime}ms${slowWarning}`);
        
        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        logger.error(`🗄️ [DB:${operation}] ${methodName} - Failed after ${executionTime}ms - Error: ${error.message}`);
        throw error;
      }
    };

    return descriptor;
  };
}
