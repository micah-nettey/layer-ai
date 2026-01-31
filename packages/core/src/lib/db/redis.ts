import Redis from 'ioredis';
import type { Gate } from '@layer-ai/sdk';

// Create redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Reconnect when redis is in readonly mode
      return true;
    }
    return false;
  },
});

// Connection event handlers
redis.on('connect', () => {
  console.log('Connected to Redis cache');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Cache key builders
const CACHE_TTL = 300;

function getGateCacheKey(userId: string, gateName: string): string {
  return `gate:${userId}:name:${gateName}`;
}

function getGateCacheKeyById(userId: string, gateId: string): string {
  return `gate:${userId}:id:${gateId}`;
}

// Cache operations
export const cache = {
  // get the gate
  async getGate(userId: string, gateName: string): Promise<Gate | null> {
    try {
      const key = getGateCacheKey(userId, gateName);
      const cached = await redis.get(key);

      if (!cached) {
        return null;
      }

      const gate = JSON.parse(cached);
      gate.createdAt = new Date(gate.createdAt);
      gate.updatedAt = new Date(gate.updatedAt);

      return gate;
    } catch (error) {
      console.error('Redis get error:', error);
      return null; // if we fail, then we fetch from the db
    }
  },

  // get the gate by ID
  async getGateById(userId: string, gateId: string): Promise<Gate | null> {
    try {
      const key = getGateCacheKeyById(userId, gateId);
      const cached = await redis.get(key);

      if (!cached) {
        return null;
      }

      const gate = JSON.parse(cached);
      gate.createdAt = new Date(gate.createdAt);
      gate.updatedAt = new Date(gate.updatedAt);

      return gate;
    } catch (error) {
      console.error('Redis get error:', error);
      return null; // if we fail, then we fetch from the db
    }
  },

  // Set gate in cache
  async setGate(userId: string, gateName: string, gate: Gate): Promise<void> {
    try {
      const key = getGateCacheKey(userId, gateName);
      await redis.setex(key, CACHE_TTL, JSON.stringify(gate));

      // Also cache by ID for lookups by gate ID
      const keyById = getGateCacheKeyById(userId, gate.id);
      await redis.setex(keyById, CACHE_TTL, JSON.stringify(gate));
    } catch (error) {
      console.error('Redis set error:', error);
      // cache miss here is okay
    }
  },

  // Invalidate gate cache
  async invalidateGate(userId: string, gateName: string): Promise<void> {
    try {
      const key = getGateCacheKey(userId, gateName);
      await redis.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  },

  // Invalidate all gates for a user
  async invalidateUserGates(userId: string): Promise<void> {
    try {
      const pattern = `gate:${userId}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis bulk delete error:', error);
    }
  },

  // health check
  async ping(): Promise<boolean> {
    try {
      const result = await redis.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  },
};

export default redis;
