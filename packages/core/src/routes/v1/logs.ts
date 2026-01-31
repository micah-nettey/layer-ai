import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { db } from '../../lib/db/postgres.js';
import { authenticate } from '../../middleware/auth.js';

const router: RouterType = Router();

// All routes require SDK authentication
router.use(authenticate);

// GET /v1/logs - List request logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const gate = req.query.gate as string | undefined;
    const success = req.query.success as string | undefined;

    let query = `
      SELECT
        id,
        user_id,
        gate_id,
        gate_name,
        model_requested,
        model_used,
        prompt_tokens,
        completion_tokens,
        cost_usd,
        latency_ms,
        success,
        error_message,
        request_payload,
        response_payload,
        created_at as logged_at
      FROM requests
      WHERE user_id = $1
    `;

    const params: any[] = [userId];

    if (gate) {
      query += ` AND gate_id = $2`;
      params.push(gate);
    }

    if (success !== undefined) {
      query += ` AND success = $${params.length + 1}`;
      params.push(success === 'true');
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const logs = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      gateId: row.gate_id,
      gateName: row.gate_name,
      modelRequested: row.model_requested,
      modelUsed: row.model_used,
      promptTokens: row.prompt_tokens,
      completionTokens: row.completion_tokens,
      costUsd: parseFloat(row.cost_usd),
      latencyMs: row.latency_ms,
      success: row.success,
      errorMessage: row.error_message,
      requestPayload: row.request_payload,
      responsePayload: row.response_payload,
      loggedAt: row.logged_at,
    }));

    res.json(logs);
  } catch (error) {
    console.error('Logs list error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to fetch logs' });
  }
});

// GET /v1/logs/overview - Get logs for api calls
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const [statsResult, gatesResult, recentRequestsResult] = await Promise.all([
      // Get aggregate stats
      db.query(
        `SELECT
          COUNT(*) as total_requests,
          COALESCE(SUM(cost_usd), 0) as total_cost,
          COALESCE(AVG(latency_ms), 0) as avg_latency
         FROM requests
         WHERE user_id = $1`,
        [userId]
      ),
      // Get gates count
      db.query(
        `SELECT COUNT(*) as active_gates FROM gates WHERE user_id = $1`,
        [userId]
      ),
      // Get recent requests
      db.query(
        `SELECT
          id,
          gate_name,
          model_used,
          prompt_tokens,
          completion_tokens,
          total_tokens,
          cost_usd,
          latency_ms,
          success,
          created_at
         FROM requests
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId]
      ),
    ]);

    const stats = statsResult.rows[0];
    const gatesCount = gatesResult.rows[0];
    const recentRequests = recentRequestsResult.rows;

    res.json({
      totalRequests: parseInt(stats.total_requests),
      totalCost: parseFloat(stats.total_cost),
      avgLatency: Math.round(parseFloat(stats.avg_latency)),
      activeGates: parseInt(gatesCount.active_gates),
      recentRequests: recentRequests.map((req) => ({
        id: req.id,
        gateName: req.gate_name,
        model: req.model_used,
        promptTokens: req.prompt_tokens,
        completionTokens: req.completion_tokens,
        totalTokens: req.total_tokens,
        cost: parseFloat(req.cost_usd),
        latency: req.latency_ms,
        success: req.success,
        createdAt: req.created_at,
      })),
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to fetch analytics' });
  }
});

// GET /v1/logs/gate/:gateId - Get metrics for a specific gate
router.get('/gate/:gateId', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { gateId } = req.params;

    // Verify gate ownership
    const gateCheck = await db.query(
      'SELECT id FROM gates WHERE id = $1 AND user_id = $2',
      [gateId, userId]
    );

    if (gateCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'not_found', message: 'Gate not found' });
    }

    // Get gate metrics
    const metricsResult = await db.query(
      `SELECT
        COUNT(*) as requests,
        COALESCE(SUM(cost_usd), 0) as cost,
        COALESCE(AVG(latency_ms), 0) as latency,
        MAX(created_at) as last_request
       FROM requests
       WHERE gate_id = $1`,
      [gateId]
    );

    const metrics = metricsResult.rows[0];

    res.json({
      requests: parseInt(metrics.requests) || 0,
      cost: parseFloat(metrics.cost) || 0,
      latency: Math.round(parseFloat(metrics.latency)) || 0,
      lastRequest: metrics.last_request,
    });
  } catch (error) {
    console.error('Gate metrics error:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch gate metrics',
    });
  }
});

export default router;
