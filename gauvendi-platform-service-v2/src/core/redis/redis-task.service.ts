import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { ConnectorTypeEnum } from '../enums/common';
import { combineMaxDateRanges } from '../utils/datetime.util';
import {
  PushToPmsTaskData,
  PushToPmsTaskKeyComponents,
  TaskData,
  TaskKeyComponents,
  TaskQueryOptions,
  TaskResult,
  TaskStatus
} from './redis-task.interface';
import { stringifyIdentifier } from './redis-task.utils';

export enum RedisTaskNamespace {
  PMS = 'pms',
  BOOKING = 'booking',
  INVENTORY = 'inventory'
}

export enum RedisTaskContext {
  PUSH_RATE_PLAN_PRICING = 'push_rate_plan_pricing'
}

@Injectable()
export class RedisTaskService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisTaskService.name);
  private client: Redis;
  private readonly DB_NUMBER = 3; // Database number for tasks

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: +(this.configService.get<number>('REDIS_PORT') || 6379),
      username: this.configService.get<string>('REDIS_USERNAME') || '',
      password: this.configService.get<string>('REDIS_PASSWORD') || '',
      db: this.DB_NUMBER, // Connect to DB 3
      maxRetriesPerRequest: null,
      family: 0
    });

    this.client.on('connect', () => {
      this.logger.log(`Connected to Redis DB ${this.DB_NUMBER} for Task Management`);
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Task DB error:', err);
    });
  }

  /**
   * Set/Update Push to PMS task with date range merging
   * If task exists:
   * - PROCESSING status → mark as OVERRIDE and update with combined date range
   * - PENDING status → update with combined date range
   * If task doesn't exist → create new task
   */
  async setPushToPmsTask(
    components: PushToPmsTaskKeyComponents,
    data: {
      fromDate: string;
      toDate: string;
      pmsRatePlanCode: string;
      pmsRoomProductCode: string;
      connectorType: ConnectorTypeEnum;
    }
  ): Promise<void> {
    const existingTask = await this.getPushToPmsTask(components);

    if (existingTask) {
      // Combine date ranges to get the largest range
      const combinedDateRange = combineMaxDateRanges([
        { fromDate: existingTask.fromDate!, toDate: existingTask.toDate! },
        { fromDate: data.fromDate, toDate: data.toDate }
      ]);

      if (!combinedDateRange) {
        this.logger.warn('Failed to combine date ranges, using new task date range');
        await this.updateTask(components, {
          fromDate: data.fromDate,
          toDate: data.toDate
        });
        return;
      }

      if (existingTask.status === TaskStatus.PROCESSING) {
        // Mark as OVERRIDE and update with combined date range
        this.logger.log(
          `Task marked as OVERRIDE. Combined date range: ${combinedDateRange.fromDate} to ${combinedDateRange.toDate}`
        );
        await this.updateTask(components, {
          status: TaskStatus.OVERRIDE,
          fromDate: combinedDateRange.fromDate,
          toDate: combinedDateRange.toDate
        });
      } else if (existingTask.status === TaskStatus.PENDING) {
        // Update with combined date range
        await this.updateTask(components, {
          fromDate: combinedDateRange.fromDate,
          toDate: combinedDateRange.toDate
        });
      } else {
        // For other statuses, just update the date range
        await this.updateTask(components, {
          fromDate: data.fromDate,
          toDate: data.toDate
        });
      }
    } else {
      // Create new task
      await this.setTask(components, {
        fromDate: data.fromDate,
        toDate: data.toDate,
        status: TaskStatus.PENDING
      });
      this.logger.log(`New task created with date range: ${data.fromDate} to ${data.toDate}`);
    }
  }

  async getPushToPmsTask(
    components: PushToPmsTaskKeyComponents
  ): Promise<PushToPmsTaskData | null> {
    return await this.getTask<PushToPmsTaskData>(components);
  }

  async deletePushToPmsTask(components: PushToPmsTaskKeyComponents): Promise<boolean> {
    const existingTask = await this.getPushToPmsTask(components);
    if (existingTask && existingTask.status === TaskStatus.OVERRIDE) {
      await this.updateTask(components, {
        status: TaskStatus.PENDING
      });
      return true;
    }
    await this.deleteTask(components);
    return true;
  }

  /**
   * Get the oldest pending PushToPms task
   * Useful for processing tasks in FIFO order
   * @returns The oldest pending PushToPms task or null
   */
  async getOldestPushToPmsTask(): Promise<TaskResult<PushToPmsTaskData> | null> {
    return await this.getOldestPendingTask<PushToPmsTaskData>(
      RedisTaskNamespace.PMS,
      RedisTaskContext.PUSH_RATE_PLAN_PRICING
    );
  }

  /**
   * Get all pending PushToPms tasks sorted by creation time (oldest first)
   * @param limit Optional limit for number of tasks to return
   * @returns Array of pending tasks sorted by creation time
   */
  async getPendingPushToPmsTasks(limit?: number): Promise<TaskResult<PushToPmsTaskData>[]> {
    const pattern = `${RedisTaskNamespace.PMS}:${RedisTaskContext.PUSH_RATE_PLAN_PRICING}:*`;
    const allTasks = await this.findTasksByPattern<PushToPmsTaskData>(pattern, {
      sortBy: 'createdAt',
      sortOrder: 'asc',
      limit
    });

    // Filter by PENDING status
    return allTasks.filter((task) => task.data.status === TaskStatus.PENDING);
  }

  /**
   * Set/Create a task with data
   * @param components - Task key components
   * @param data - Task data (fromDate, toDate, etc.)
   * @param ttl - Time to live in seconds (optional)
   */
  async setTask<T extends TaskData = TaskData>(
    components: TaskKeyComponents,
    data: Partial<T>,
    ttl?: number
  ): Promise<string> {
    const key = this.buildTaskKey(components);

    const taskData: T = {
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      status: data.status || TaskStatus.PENDING
    } as T;

    const value = JSON.stringify(taskData);

    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }

    this.logger.debug(`Task set: ${key}`);
    return key;
  }

  /**
   * Get task data by key components
   */
  async getTask<T extends TaskData = TaskData>(components: TaskKeyComponents): Promise<T | null> {
    const key = this.buildTaskKey(components);
    const value = await this.client.get(key);

    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error parsing task data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Update task data (merges with existing data)
   */
  async updateTask<T extends TaskData = TaskData>(
    components: TaskKeyComponents,
    data: Partial<T>,
    ttl?: number
  ): Promise<boolean> {
    const existingData = await this.getTask<T>(components);

    if (!existingData) {
      this.logger.warn(`Task not found for update: ${this.buildTaskKey(components)}`);
      return false;
    }

    const updatedData: T = {
      ...existingData,
      ...data,
      updatedAt: new Date().toISOString()
    };

    await this.setTask(components, updatedData, ttl);
    return true;
  }

  /**
   * Delete a task
   */
  async deleteTask(components: TaskKeyComponents): Promise<boolean> {
    const key = this.buildTaskKey(components);
    const result = await this.client.del(key);

    this.logger.debug(`Task deleted: ${key}`);
    return result > 0;
  }

  /**
   * Get task by full key string
   */
  async getTaskByKey<T extends TaskData = TaskData>(key: string): Promise<T | null> {
    const value = await this.client.get(key);

    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error parsing task data for key ${key}:`, error);
      return null;
    }
  }

  async setTaskByKey<T = any>(key: string, data: T, ttl?: number): Promise<boolean> {
    if (ttl) {
      await this.client.set(key, JSON.stringify(data), 'EX', ttl);
    } else {
      await this.client.set(key, JSON.stringify(data));
    }

    this.logger.debug(`Task set: ${key}`);
    return true;
  }

  /**
   * Delete task by full key string
   */
  async deleteTaskByKey(key: string): Promise<boolean> {
    const result = await this.client.del(key);
    this.logger.debug(`Task deleted: ${key}`);
    return result > 0;
  }

  /**
   * Check if task exists
   */
  async hasTask(components: TaskKeyComponents): Promise<boolean> {
    const key = this.buildTaskKey(components);
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  /**
   * Get task TTL (time to live) in seconds
   */
  async getTaskTTL(components: TaskKeyComponents): Promise<number> {
    const key = this.buildTaskKey(components);
    return await this.client.ttl(key);
  }

  /**
   * Set task expiration
   */
  async setTaskExpiration(components: TaskKeyComponents, seconds: number): Promise<boolean> {
    const key = this.buildTaskKey(components);
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  /**
   * Find tasks by pattern
   * Example patterns:
   * - "push_to_pms:*" - All push to PMS tasks
   * - "push_to_pms:hotel123:*" - All tasks for hotel123
   * - "*:rateplan456:*" - All tasks for specific rate plan
   */
  async findTasksByPattern<T extends TaskData = TaskData>(
    pattern: string,
    options?: TaskQueryOptions
  ): Promise<TaskResult<T>[]> {
    const keys: string[] = [];
    const count = options?.count || 100;

    let cursor = '0';
    do {
      const [nextCursor, foundKeys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        count
      );

      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    // Get all task data
    const results: TaskResult<T>[] = [];

    for (const key of keys) {
      const data = await this.getTaskByKey<T>(key);
      if (data) {
        results.push({ key, data });
      }
    }

    // Sort if requested
    if (options?.sortBy) {
      const sortField = options.sortBy;
      const sortOrder = options.sortOrder || 'asc';

      results.sort((a, b) => {
        const dateA = a.data[sortField] ? new Date(a.data[sortField]!).getTime() : 0;
        const dateB = b.data[sortField] ? new Date(b.data[sortField]!).getTime() : 0;

        if (sortOrder === 'asc') {
          return dateA - dateB; // Oldest first
        } else {
          return dateB - dateA; // Newest first
        }
      });
    }

    // Apply limit if specified
    if (options?.limit && options.limit > 0) {
      return results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get the oldest task matching a pattern
   * @param pattern Pattern to search for tasks
   * @returns The oldest task or null if no tasks found
   */
  async getOldestTask<T extends TaskData = TaskData>(
    pattern: string
  ): Promise<TaskResult<T> | null> {
    const results = await this.findTasksByPattern<T>(pattern, {
      sortBy: 'createdAt',
      sortOrder: 'asc',
      limit: 1
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get the oldest pending task by namespace and context
   * @param namespace Task namespace
   * @param context Task context
   * @returns The oldest pending task or null
   */
  async getOldestPendingTask<T extends TaskData = TaskData>(
    namespace: string,
    context: string
  ): Promise<TaskResult<T> | null> {
    const pattern = `${namespace}:${context}:*`;
    const allTasks = await this.findTasksByPattern<T>(pattern, {
      sortBy: 'createdAt',
      sortOrder: 'asc'
    });

    // Filter by PENDING status and return the first one
    const pendingTasks = allTasks.filter((task) => task.data.status === TaskStatus.PENDING);
    return pendingTasks.length > 0 ? pendingTasks[0] : null;
  }

  /**
   * Get all tasks by namespace and context
   */
  async getTasksByNamespaceContext<T extends TaskData = TaskData>(
    namespace: string,
    context: string
  ): Promise<TaskResult<T>[]> {
    const pattern = `${namespace}:${context}:*`;
    return this.findTasksByPattern<T>(pattern);
  }

  /**
   * Get all tasks with specific identifier prefix
   * Useful for getting all tasks for a property, rate plan, etc.
   */
  async getTasksByIdentifier<T extends TaskData = TaskData>(
    namespace: string,
    context: string,
    identifierPrefix: string | Record<string, string>,
    options?: TaskQueryOptions
  ): Promise<TaskResult<T>[]> {
    const identifierString =
      typeof identifierPrefix === 'string'
        ? identifierPrefix
        : stringifyIdentifier(identifierPrefix);

    const pattern = `${namespace}:${context}:${identifierString}*`;
    return this.findTasksByPattern<T>(pattern, options);
  }

  /**
   * Delete all tasks matching a pattern
   */
  async deleteTasksByPattern(pattern: string): Promise<number> {
    const keys: string[] = [];

    let cursor = '0';
    do {
      const [nextCursor, foundKeys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );

      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    if (keys.length === 0) return 0;

    const result = await this.client.del(...keys);
    this.logger.debug(`Deleted ${result} tasks matching pattern: ${pattern}`);
    return result;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(components: TaskKeyComponents, status: TaskStatus): Promise<boolean> {
    return this.updateTask(components, { status });
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus<T extends TaskData = TaskData>(
    namespace: string,
    context: string,
    status: TaskStatus
  ): Promise<TaskResult<T>[]> {
    const pattern = `${namespace}:${context}:*`;
    const allTasks = await this.findTasksByPattern<T>(pattern);

    return allTasks.filter((task) => task.data.status === status);
  }

  /**
   * Extend task date range
   */
  async extendTaskDateRange(
    components: TaskKeyComponents,
    fromDate?: string,
    toDate?: string
  ): Promise<boolean> {
    const existingData = await this.getTask(components);

    if (!existingData) return false;

    const updatedData: Partial<TaskData> = {
      fromDate: fromDate || existingData.fromDate,
      toDate: toDate || existingData.toDate
    };

    return this.updateTask(components, updatedData);
  }

  /**
   * Get all task keys (use with caution on large datasets)
   * @param namespace - Optional namespace filter
   * @param context - Optional context filter
   */
  async getAllTaskKeys(namespace?: string, context?: string): Promise<string[]> {
    let pattern = '*';

    if (namespace && context) {
      pattern = `${namespace}:${context}:*`;
    } else if (namespace) {
      pattern = `${namespace}:*`;
    }

    const keys: string[] = [];

    let cursor = '0';
    do {
      const [nextCursor, foundKeys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );

      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    return keys;
  }

  private buildTaskKey(components: TaskKeyComponents): string {
    return components.toKey();
  }

  /**
   * Get task count by pattern
   * @param namespace - Optional namespace filter
   * @param context - Optional context filter
   */
  async getTaskCount(namespace?: string, context?: string): Promise<number> {
    const keys = await this.getAllTaskKeys(namespace, context);
    return keys.length;
  }

  /**
   * Clear all tasks (use with caution!)
   */
  async clearAllTasks(): Promise<void> {
    await this.client.flushdb();
    this.logger.warn('All tasks cleared from Redis DB 3');
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis Task Service disconnected');
  }
}
