import { ConnectorTypeEnum } from '../enums/common';
import { RedisTaskContext, RedisTaskNamespace } from './redis-task.service';
import { stringifyIdentifier } from './redis-task.utils';

/**
 * Generic interface for task data stored in Redis
 */

export class TaskData {
  createdAt?: string;
  updatedAt?: string;
  status?: TaskStatus;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Task status enum
 */
export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  OVERRIDE = 'override'
}

export class TaskKeyComponents<T extends Record<string, string> = Record<string, string>> {
  namespace: RedisTaskNamespace; // Domain/module (e.g., 'pms', 'booking', 'inventory')
  context: RedisTaskContext; // Action/operation (e.g., 'push', 'pull', 'sync', 'update')
  identifier: T; // Main identifier (can be string or object)
  subKey?: string; // Optional additional key

  toKey(): string {
    const parts: string[] = [this.namespace.toString(), this.context.toString()];
    const identifierString = stringifyIdentifier(this.identifier);
    parts.push(identifierString);
    if (this.subKey) {
      parts.push(this.subKey);
    }
    return parts.join(':');
  }
}

export class PushToPmsTaskKeyComponents extends TaskKeyComponents<{
  hotelId: string;
  ratePlanId: string;
  roomProductId: string;
}> {
  constructor() {
    super();
    this.namespace = RedisTaskNamespace.PMS;
    this.context = RedisTaskContext.PUSH_RATE_PLAN_PRICING;
  }

  override toKey(): string {
    const parts: string[] = [this.namespace.toString(), this.context.toString()];
    const identifierString = `${this.identifier.hotelId}:${this.identifier.ratePlanId}:${this.identifier.roomProductId}`;
    parts.push(identifierString);
    if (this.subKey) {
      parts.push(this.subKey);
    }
    return parts.join(':');
  }

  setIdentifier(identifier: { hotelId: string; ratePlanId: string; roomProductId: string }) {
    this.identifier = identifier;
  }

  setIdentifierFromKey(key: string) {
    const parts = key.split(':');

    if (parts.length !== 5) {
      throw new Error('Invalid key');
    }

    this.setIdentifier({
      hotelId: parts[2],
      ratePlanId: parts[3],
      roomProductId: parts[4]
    });
  }
}

export class PushToPmsTaskData extends TaskData {
  fromDate: string;
  toDate: string;
  pmsRatePlanCode: string;
  pmsRoomProductCode: string;
  connectorType: ConnectorTypeEnum;
}

export interface TaskQueryOptions {
  pattern?: string;
  count?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface TaskResult<T extends TaskData = TaskData> {
  key: string;
  data: T;
}
