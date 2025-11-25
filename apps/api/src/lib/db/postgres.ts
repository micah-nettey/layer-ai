import pg from 'pg';
import type { User, ApiKey, Gate, Request as RequestLog } from '@layer-ai/types';

const { Pool } = pg;

// Lazy-initialize connection pool
let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // max num of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // test connection on startup
    pool.on('connect', () => {
      console.log('Connected to PostgreSQL database');
    });

    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
      process.exit(-1);
    });
  }
  return pool;
}

// function to convert snake_case DB cols to camelCase TypeScript
function toCamelCase(obj: any): any {
  if (!obj) return obj;

  const converted: any = {}
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    let value = obj[key];

    // Convert numeric strings to numbers for specific fields
    if ((camelKey === 'temperature' || camelKey === 'topP') && typeof value === 'string') {
      value = parseFloat(value);
    }
    if (camelKey === 'maxTokens' && typeof value === 'string') {
      value = parseInt(value, 10);
    }

    converted[camelKey] = value;
  }

  return converted;
}

// Database query functions
export const db = {
  // generic query function 
  async query(text: string, params?: any[]) {
    const start = Date.now();
    const res = await getPool().query(text, params);
    const duration = Date.now() - start; 
    console.log('Executed query', { text, duration, rows: res.rowCount});
    return res;
  },

  // Users
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await getPool().query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async getUserById(id: string): Promise<User | null> {
    const result = await getPool().query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async createUser(email: string, passwordHash: string): Promise<User> {
    const result = await getPool().query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
      [email, passwordHash]
    );
    return toCamelCase(result.rows[0]);
  },

  // API Keys
  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    const result = await getPool().query(
      'SELECT * FROM api_keys WHERE key_hash = $1 AND is_active = true', 
      [keyHash]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async createApiKey(userId: string, keyHash: string, keyPrefix: string, name: string): Promise<ApiKey> {
    const result = await getPool().query(
      'INSERT INTO api_keys (user_id, key_hash, key_prefix, name) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, keyHash, keyPrefix, name]
    );
    return toCamelCase(result.rows[0]);
  },

  async updateApiKeyLastUsed(keyHash: string): Promise<void> {
    await getPool().query(
      'UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = $1',
      [keyHash]
    )
  },

  async getApiKeysForUser(userId: string): Promise<ApiKey[]> {
    const result = await getPool().query(
      'SELECT id, user_id, key_prefix, name, created_at, last_used_at FROM api_keys WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(toCamelCase);
  },

  async deleteApiKey(id: string, userId: string): Promise<boolean> {
    const result = await getPool().query(
      'UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  },

  // Gates 
  async getGateByUserAndName(userId: string, gateName: string): Promise<Gate | null> {
    const result = await getPool().query(
      'SELECT * FROM gates WHERE user_id = $1 AND name = $2',
      [userId, gateName]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async getGatesForUser(userId: string): Promise<Gate[]> {
    const result = await getPool().query(
      'SELECT * FROM gates WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(toCamelCase);
  },

  async createGate(userId: string, data: any): Promise<Gate> {
    const result = await getPool().query(
      `INSERT INTO gates (user_id, name, description, model, system_prompt, allow_overrides, temperature, max_tokens, top_p, tags, routing_strategy, fallback_models)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
       [
         userId,
         data.name,
         data.description,
         data.model,
         data.systemPrompt,
         data.allowOverrides ? JSON.stringify(data.allowOverrides) : null,
         data.temperature,
         data.maxTokens,
         data.topP,
         JSON.stringify(data.tags || []),
         data.routingStrategy || 'single',
         JSON.stringify(data.fallbackModels || [])
       ]
    );
    return toCamelCase(result.rows[0]);
  },

  async getGateById(id: string): Promise<Gate | null> {
    const result = await getPool().query(
      'SELECT * FROM gates WHERE id = $1',
      [id]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async updateGate(id: string, data: any): Promise<Gate | null> {
    const result = await getPool().query(
      `UPDATE gates SET
        description = COALESCE($2, description),
        model = COALESCE($3, model),
        system_prompt = COALESCE($4, system_prompt),
        allow_overrides = COALESCE($5, allow_overrides),
        temperature = COALESCE($6, temperature),
        max_tokens = COALESCE($7, max_tokens),
        top_p = COALESCE($8, top_p),
        tags = COALESCE($9, tags),
        routing_strategy = COALESCE($10, routing_strategy),
        fallback_models = COALESCE($11, fallback_models),
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [
        id,
        data.description,
        data.model,
        data.systemPrompt,
        data.allowOverrides ? JSON.stringify(data.allowOverrides) : null,
        data.temperature,
        data.maxTokens,
        data.topP,
        data.tags ? JSON.stringify(data.tags) : null,
        data.routingStrategy,
        data.fallbackModels ? JSON.stringify(data.fallbackModels) : null,
      ]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async deleteGate(id: string): Promise<boolean> {
    const result = await getPool().query(
      'DELETE FROM gates WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  },

  // Request Logging 
  async logRequest(data: any): Promise<void> {
    await getPool().query(
      `INSERT INTO requests (
      user_id, gate_id, gate_name, model_requested, model_used, prompt_tokens,
      completion_tokens, total_tokens, cost_usd, latency_ms, success, 
      error_message, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        data.userId, data.gateId, data.gateName, data.modelRequested, data.modelUsed, data.promptTokens, 
        data.completionTokens, data.totalTokens, data.costUsd, data.latencyMs, data.success, 
        data.errorMessage, data.userAgent, data.ipAddress
      ]
    )
  },

  // Session Keys
  async getSessionKeyByHash(keyHash: string): Promise<{ userId: string; expiresAt: Date } | null> {
    const result = await getPool().query(
      'SELECT user_id, expires_at FROM session_keys WHERE key_hash = $1 AND expires_at > NOW()',
      [keyHash]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  }
}; 

export default getPool; 