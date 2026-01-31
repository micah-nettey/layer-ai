import pg from 'pg';
import type {
  User,
  ApiKey,
  Gate,
  Request as RequestLog,
  ProviderKey,
} from '@layer-ai/sdk';

const { Pool } = pg;

// Lazy-initialize connection pool
let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
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

  const converted: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    let value = obj[key];

    // Convert numeric strings to numbers for specific fields
    if (
      (camelKey === 'temperature' ||
        camelKey === 'topP' ||
        camelKey === 'costWeight' ||
        camelKey === 'latencyWeight' ||
        camelKey === 'qualityWeight') &&
      typeof value === 'string'
    ) {
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
    console.log('Executed query', { text, duration, rows: res.rowCount });
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
    const result = await getPool().query('SELECT * FROM users WHERE id = $1', [
      id,
    ]);
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

  async createApiKey(
    userId: string,
    keyHash: string,
    keyPrefix: string,
    name: string
  ): Promise<ApiKey> {
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
    );
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
  async getGateByUserAndName(
    userId: string,
    gateName: string
  ): Promise<Gate | null> {
    const result = await getPool().query(
      'SELECT * FROM gates WHERE user_id = $1 AND name = $2 AND deleted_at IS NULL',
      [userId, gateName]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async getGateByUserAndId(
    userId: string,
    gateId: string
  ): Promise<Gate | null> {
    const result = await getPool().query(
      'SELECT * FROM gates WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL',
      [userId, gateId]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async getGatesForUser(userId: string): Promise<Gate[]> {
    const result = await getPool().query(
      'SELECT * FROM gates WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(toCamelCase);
  },

  async createGate(userId: string, data: any): Promise<Gate> {
    const result = await getPool().query(
      `INSERT INTO gates (user_id, name, description, task_type, model, system_prompt, allow_overrides, temperature, max_tokens, top_p, tags, routing_strategy, fallback_models, cost_weight, latency_weight, quality_weight, analysis_method, reanalysis_period, auto_apply_recommendations, task_analysis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`,
      [
        userId,
        data.name,
        data.description,
        data.taskType,
        data.model,
        data.systemPrompt,
        data.allowOverrides ? JSON.stringify(data.allowOverrides) : null,
        data.temperature,
        data.maxTokens,
        data.topP,
        JSON.stringify(data.tags || []),
        data.routingStrategy || 'fallback',
        JSON.stringify(data.fallbackModels || []),
        data.costWeight ?? 0.33,
        data.latencyWeight ?? 0.33,
        data.qualityWeight ?? 0.34,
        data.analysisMethod || 'balanced',
        data.reanalysisPeriod || 'never',
        data.autoApplyRecommendations ?? false,
        data.taskAnalysis ? JSON.stringify(data.taskAnalysis) : null,
      ]
    );
    return toCamelCase(result.rows[0]);
  },

  async getGateById(id: string): Promise<Gate | null> {
    const result = await getPool().query(
      'SELECT * FROM gates WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async updateGate(id: string, data: any): Promise<Gate | null> {
    const result = await getPool().query(
      `UPDATE gates SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        task_type = COALESCE($4, task_type),
        model = COALESCE($5, model),
        system_prompt = COALESCE($6, system_prompt),
        allow_overrides = COALESCE($7, allow_overrides),
        temperature = COALESCE($8, temperature),
        max_tokens = COALESCE($9, max_tokens),
        top_p = COALESCE($10, top_p),
        tags = COALESCE($11, tags),
        routing_strategy = COALESCE($12, routing_strategy),
        fallback_models = COALESCE($13, fallback_models),
        cost_weight = COALESCE($14, cost_weight),
        latency_weight = COALESCE($15, latency_weight),
        quality_weight = COALESCE($16, quality_weight),
        analysis_method = COALESCE($17, analysis_method),
        reanalysis_period = COALESCE($18, reanalysis_period),
        auto_apply_recommendations = COALESCE($19, auto_apply_recommendations),
        task_analysis = COALESCE($20, task_analysis),
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [
        id,
        data.name,
        data.description,
        data.taskType,
        data.model,
        data.systemPrompt,
        data.allowOverrides ? JSON.stringify(data.allowOverrides) : null,
        data.temperature,
        data.maxTokens,
        data.topP,
        data.tags ? JSON.stringify(data.tags) : null,
        data.routingStrategy,
        data.fallbackModels ? JSON.stringify(data.fallbackModels) : null,
        data.costWeight,
        data.latencyWeight,
        data.qualityWeight,
        data.analysisMethod,
        data.reanalysisPeriod,
        data.autoApplyRecommendations,
        data.taskAnalysis ? JSON.stringify(data.taskAnalysis) : null,
      ]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async deleteGate(id: string): Promise<boolean> {
    // Soft delete: set deleted_at timestamp instead of hard delete
    const result = await getPool().query(
      'UPDATE gates SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
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
      error_message, user_agent, ip_address, request_payload, response_payload)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        data.userId,
        data.gateId,
        data.gateName,
        data.modelRequested,
        data.modelUsed,
        data.promptTokens,
        data.completionTokens,
        data.totalTokens,
        data.costUsd,
        data.latencyMs,
        data.success,
        data.errorMessage,
        data.userAgent,
        data.ipAddress,
        data.requestPayload ? JSON.stringify(data.requestPayload) : '{}',
        data.responsePayload ? JSON.stringify(data.responsePayload) : null,
      ]
    );
  },

  async getRequestLogs(
    userId: string,
    options?: {
      gateId?: string;
      success?: boolean;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    const {
      gateId,
      success,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = options || {};

    let query = 'SELECT * FROM requests WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (gateId) {
      query += ` AND gate_id = $${paramIndex}`;
      params.push(gateId);
      paramIndex++;
    }

    if (success !== undefined) {
      query += ` AND success = $${paramIndex}`;
      params.push(success);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await getPool().query(query, params);
    return result.rows.map(toCamelCase);
  },

  // Session Keys
  async getSessionKeyByHash(
    keyHash: string
  ): Promise<{ userId: string; expiresAt: Date } | null> {
    const result = await getPool().query(
      'SELECT user_id, expires_at FROM session_keys WHERE key_hash = $1 AND expires_at > NOW()',
      [keyHash]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async createSessionKey(userId: string): Promise<string> {
    const crypto = await import('crypto');
    const rawKey = `layer_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await getPool().query(
      'INSERT INTO session_keys (user_id, key_hash, expires_at) VALUES ($1, $2, $3)',
      [userId, keyHash, expiresAt]
    );

    return rawKey;
  },

  async deleteSessionKeysForUser(userId: string): Promise<void> {
    await getPool().query('DELETE FROM session_keys WHERE user_id = $1', [
      userId,
    ]);
  },

  // Provider Keys (BYOK)
  async getProviderKey(
    userId: string,
    provider: string
  ): Promise<ProviderKey | null> {
    const result = await getPool().query(
      'SELECT * FROM provider_keys WHERE user_id = $1 AND provider = $2 AND deleted_at IS NULL',
      [userId, provider]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async getProviderKeys(userId: string): Promise<ProviderKey[]> {
    const result = await getPool().query(
      'SELECT * FROM provider_keys WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(toCamelCase);
  },

  async createProviderKey(
    userId: string,
    provider: string,
    encryptedKey: { encrypted: string; iv: string; authTag: string },
    keyPrefix: string
  ): Promise<ProviderKey> {
    const result = await getPool().query(
      `INSERT INTO provider_keys (user_id, provider, encrypted_key, key_prefix)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, provider, JSON.stringify(encryptedKey), keyPrefix]
    );
    return toCamelCase(result.rows[0]);
  },

  async updateProviderKey(
    userId: string,
    provider: string,
    encryptedKey: { encrypted: string; iv: string; authTag: string },
    keyPrefix: string
  ): Promise<ProviderKey | null> {
    const result = await getPool().query(
      `UPDATE provider_keys
       SET encrypted_key = $3, key_prefix = $4, deleted_at = NULL, is_active = true, updated_at = NOW()
       WHERE user_id = $1 AND provider = $2
       RETURNING *`,
      [userId, provider, JSON.stringify(encryptedKey), keyPrefix]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async deleteProviderKey(userId: string, provider: string): Promise<boolean> {
    const result = await getPool().query(
      'UPDATE provider_keys SET deleted_at = NOW() WHERE user_id = $1 AND provider = $2 AND deleted_at IS NULL',
      [userId, provider]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async toggleProviderKeyActive(
    userId: string,
    provider: string,
    isActive: boolean
  ): Promise<ProviderKey | null> {
    const result = await getPool().query(
      `UPDATE provider_keys
       SET is_active = $3, updated_at = NOW()
       WHERE user_id = $1 AND provider = $2 AND deleted_at IS NULL
       RETURNING *`,
      [userId, provider, isActive]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async hardDeleteProviderKey(
    userId: string,
    provider: string
  ): Promise<boolean> {
    const result = await getPool().query(
      'DELETE FROM provider_keys WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async getDeletedProviderKeys(daysOld: number = 90): Promise<ProviderKey[]> {
    const result = await getPool().query(
      `SELECT * FROM provider_keys
       WHERE deleted_at IS NOT NULL
       AND deleted_at < NOW() - INTERVAL '1 day' * $1
       ORDER BY deleted_at ASC`,
      [daysOld]
    );
    return result.rows.map(toCamelCase);
  },

  // Gate History
  async createGateHistory(
    gateId: string,
    gate: Partial<Gate>,
    appliedBy: 'user' | 'auto',
    changedFields?: string[]
  ): Promise<void> {
    await getPool().query(
      `INSERT INTO gate_history (
        gate_id, name, description, model, fallback_models, routing_strategy,
        temperature, max_tokens, top_p, cost_weight, latency_weight, quality_weight,
        analysis_method, task_type, task_analysis, system_prompt,
        reanalysis_period, auto_apply_recommendations, applied_by, applied_at, changed_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), $20)`,
      [
        gateId,
        gate.name,
        gate.description,
        gate.model,
        typeof gate.fallbackModels === 'string'
          ? gate.fallbackModels
          : JSON.stringify(gate.fallbackModels || []),
        gate.routingStrategy,
        gate.temperature,
        gate.maxTokens,
        gate.topP,
        gate.costWeight ?? 0.33,
        gate.latencyWeight ?? 0.33,
        gate.qualityWeight ?? 0.34,
        gate.analysisMethod ?? 'balanced',
        gate.taskType,
        typeof gate.taskAnalysis === 'string'
          ? gate.taskAnalysis
          : gate.taskAnalysis
            ? JSON.stringify(gate.taskAnalysis)
            : null,
        gate.systemPrompt,
        gate.reanalysisPeriod ?? 'never',
        gate.autoApplyRecommendations ?? false,
        appliedBy,
        changedFields ? JSON.stringify(changedFields) : null,
      ]
    );

    // Prune old history entries, keeping only the last 20
    await getPool().query(
      `DELETE FROM gate_history
       WHERE gate_id = $1
       AND id NOT IN (
         SELECT id FROM gate_history
         WHERE gate_id = $1
         ORDER BY created_at DESC
         LIMIT 20
       )`,
      [gateId]
    );
  },

  async getGateHistory(gateId: string, limit: number = 20): Promise<any[]> {
    const result = await getPool().query(
      `SELECT * FROM gate_history
       WHERE gate_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [gateId, limit]
    );
    return result.rows.map(toCamelCase);
  },

  async getGateHistoryById(id: string): Promise<any | null> {
    const result = await getPool().query(
      'SELECT * FROM gate_history WHERE id = $1',
      [id]
    );
    return result.rows[0] ? toCamelCase(result.rows[0]) : null;
  },

  async getAllGatesHistory(
    userId: string,
    limit: number = 100
  ): Promise<any[]> {
    const result = await getPool().query(
      `SELECT gh.* FROM gate_history gh
       JOIN gates g ON gh.gate_id = g.id
       WHERE g.user_id = $1
       ORDER BY gh.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map(toCamelCase);
  },

  // Activity Log
  async createActivityLog(
    gateId: string,
    userId: string | null,
    action: 'manual_update' | 'auto_update' | 'reanalysis' | 'rollback',
    details: any
  ): Promise<void> {
    await getPool().query(
      `INSERT INTO gate_activity_log (gate_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [gateId, userId, action, details ? JSON.stringify(details) : null]
    );
  },

  async getActivityLog(gateId: string, limit: number = 50): Promise<any[]> {
    const result = await getPool().query(
      `SELECT * FROM gate_activity_log
       WHERE gate_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [gateId, limit]
    );
    return result.rows.map(toCamelCase);
  },

  async getAllGatesActivity(
    userId: string,
    limit: number = 100
  ): Promise<any[]> {
    const result = await getPool().query(
      `SELECT gal.*, u.email as user_email
       FROM gate_activity_log gal
       JOIN gates g ON gal.gate_id = g.id
       LEFT JOIN users u ON gal.user_id = u.id
       WHERE g.user_id = $1
       ORDER BY gal.timestamp DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map(toCamelCase);
  },

  async getGateActivity(gateId: string, limit: number = 100): Promise<any[]> {
    const result = await getPool().query(
      `SELECT gal.*, u.email as user_email
       FROM gate_activity_log gal
       LEFT JOIN users u ON gal.user_id = u.id
       WHERE gal.gate_id = $1
       ORDER BY gal.timestamp DESC
       LIMIT $2`,
      [gateId, limit]
    );
    return result.rows.map(toCamelCase);
  },

  async rollbackGate(
    gateId: string,
    historyId: string,
    userId: string
  ): Promise<Gate | null> {
    // Get the historical configuration
    const historyEntry = await this.getGateHistoryById(historyId);

    if (!historyEntry || historyEntry.gateId !== gateId) {
      return null;
    }

    // Get the current gate state before rollback for history snapshot
    const currentGate = await this.getGateById(gateId);

    if (!currentGate) {
      return null;
    }

    // Create a snapshot of the current state before rolling back
    await this.createGateHistory(gateId, currentGate, 'user');

    // Update the gate with the historical configuration
    const result = await getPool().query(
      `UPDATE gates SET
        name = $2,
        description = $3,
        model = $4,
        fallback_models = $5,
        routing_strategy = $6,
        temperature = $7,
        max_tokens = $8,
        top_p = $9,
        cost_weight = $10,
        latency_weight = $11,
        quality_weight = $12,
        analysis_method = $13,
        task_type = $14,
        task_analysis = $15,
        system_prompt = $16,
        reanalysis_period = $17,
        auto_apply_recommendations = $18,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [
        gateId,
        historyEntry.name,
        historyEntry.description,
        historyEntry.model,
        typeof historyEntry.fallbackModels === 'string'
          ? historyEntry.fallbackModels
          : JSON.stringify(historyEntry.fallbackModels || []),
        historyEntry.routingStrategy,
        historyEntry.temperature,
        historyEntry.maxTokens,
        historyEntry.topP,
        historyEntry.costWeight ?? 0.33,
        historyEntry.latencyWeight ?? 0.33,
        historyEntry.qualityWeight ?? 0.34,
        historyEntry.analysisMethod ?? 'balanced',
        historyEntry.taskType,
        typeof historyEntry.taskAnalysis === 'string'
          ? historyEntry.taskAnalysis
          : historyEntry.taskAnalysis
            ? JSON.stringify(historyEntry.taskAnalysis)
            : null,
        historyEntry.systemPrompt,
        historyEntry.reanalysisPeriod ?? 'never',
        historyEntry.autoApplyRecommendations ?? false,
      ]
    );

    const rolledBackGate = result.rows[0] ? toCamelCase(result.rows[0]) : null;

    if (rolledBackGate) {
      // Create a history snapshot of the rolled-back state (the new current state)
      await this.createGateHistory(gateId, rolledBackGate, 'user');

      // Log the rollback activity
      await this.createActivityLog(gateId, userId, 'rollback', {
        historyId: historyId,
        rolledBackTo: historyEntry.createdAt,
        previousModel: currentGate.model,
        newModel: historyEntry.model,
      });
    }

    return rolledBackGate;
  },
};

export default getPool;
