import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

export type PricingCacheEntityType = 'rate' | 'avail';

/** Minimal shapes for hashing (no dependency on rate/availability modules). */
export interface RateEntity {
  hotelId: string;
  roomProductId: string;
  ratePlanId: string;
  date: string;
  basePrice: number;
  featureAdjustments: number;
  ratePlanAdjustments: number;
  netPrice: number;
  grossPrice: number;
  taxAmount: number;
}

export interface AvailEntity {
  hotelId: string;
  roomProductId: string;
  date: string;
  available: number;
  soldUnassigned: number;
  sold: number;
  sellLimit: number;
  adjustment: number;
}

export type PricingCacheEntity = RateEntity | AvailEntity;

const TTL_SECONDS = 400 * 24 * 60 * 60; // 400 days – “delete old by date” via expiry
const BATCH_SIZE = 5000;

@Injectable()
export class PricingCacheService {
  private readonly logger = new Logger(PricingCacheService.name);
  private readonly redis: Redis | null;

  constructor(private readonly configService: ConfigService) {
    // Initialize Redis client for caching reports
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisDb = 6;
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3
      });
      this.redis.select(redisDb).catch((err) => {});
      this.logger.verbose('Redis cache initialized for pricing cache service');
    } else {
      this.logger.warn(
        `REDIS_URL not configured, pricing cache service will be disabled: ${redisUrl}`
      );
    }
  }

  private keyRate(dto: RateEntity): string {
    return `sm:rate:${dto.hotelId}:${dto.roomProductId}:${dto.ratePlanId}:${dto.date}`;
  }

  private keyAvail(dto: AvailEntity): string {
    return `sm:avail:${dto.hotelId}:${dto.roomProductId}:${dto.date}`;
  }

  private hash(str: string): string {
    return createHash('sha256').update(str).digest('hex');
  }

  private canonicalRate(dto: RateEntity): string {
    return JSON.stringify({
      hotelId: dto.hotelId,
      roomProductId: dto.roomProductId,
      ratePlanId: dto.ratePlanId,
      date: dto.date,
      basePrice: Number(dto.basePrice ?? 0),
      featureAdjustments: Number(dto.featureAdjustments ?? 0),
      ratePlanAdjustments: Number(dto.ratePlanAdjustments ?? 0),
      netPrice: Number(dto.netPrice ?? 0),
      grossPrice: Number(dto.grossPrice ?? 0),
      taxAmount: Number(dto.taxAmount ?? 0)
    });
  }

  private canonicalAvail(dto: AvailEntity): string {
    return JSON.stringify({
      hotelId: dto.hotelId,
      roomProductId: dto.roomProductId,
      date: dto.date,
      available: Number(dto.available ?? 0),
      soldUnassigned: Number(dto.soldUnassigned ?? 0),
      sold: Number(dto.sold ?? 0),
      sellLimit: Number(dto.sellLimit ?? 0),
      adjustment: Number(dto.adjustment ?? 0)
    });
  }

  getKey(type: PricingCacheEntityType, dto: PricingCacheEntity): string {
    switch (type) {
      case 'rate':
        return this.keyRate(dto as RateEntity);
      case 'avail':
        return this.keyAvail(dto as AvailEntity);
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
  }

  getHash(type: PricingCacheEntityType, dto: PricingCacheEntity): string {
    let canonical: string;
    switch (type) {
      case 'rate':
        canonical = this.canonicalRate(dto as RateEntity);
        break;
      case 'avail':
        canonical = this.canonicalAvail(dto as AvailEntity);
        break;
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
    return this.hash(canonical);
  }

  /**
   * Returns only items whose Redis hash is missing or different (i.e. need to be pushed).
   * If Redis is not configured, returns all items (safe fallback: push everything).
   */
  async filterChanged<T extends PricingCacheEntity>(
    type: PricingCacheEntityType,
    items: T[]
  ): Promise<T[]> {
    if (!this.redis || !items.length) {
      return items;
    }
    const keys: string[] = [];
    const itemByKey = new Map<string, T>();
    for (const item of items) {
      const key = this.getKey(type, item);
      keys.push(key);
      itemByKey.set(key, item);
    }
    const currentHashes = new Map(
      keys.map((k) => [k, this.getHash(type, itemByKey.get(k)!) as string])
    );
    const changed: T[] = [];
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      const values = await this.redis.mget(...batch);
      for (let j = 0; j < batch.length; j++) {
        const key = batch[j];
        const stored = values[j];
        const current = currentHashes.get(key);
        if (current == null) continue;
        if (stored !== current) {
          const item = itemByKey.get(key);
          if (item) changed.push(item);
        }
      }
    }
    this.logger.debug(`[${type}] ${items.length} total, ${changed.length} changed (will push)`);
    return changed;
  }

  /**
   * Store hashes in Redis for the given items after successful push. Uses TTL so old data is removed by date.
   */
  async setHashes<T extends PricingCacheEntity>(
    type: PricingCacheEntityType,
    items: T[]
  ): Promise<void> {
    if (!this.redis || !items.length) return;
    const pipeline = this.redis.pipeline();
    for (const item of items) {
      const key = this.getKey(type, item);
      const hash = this.getHash(type, item);
      pipeline.set(key, hash, 'EX', TTL_SECONDS);
    }
    await pipeline.exec();
    this.logger.debug(`[${type}] Updated ${items.length} hashes in Redis (TTL ${TTL_SECONDS}s)`);
  }
}
