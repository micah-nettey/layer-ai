import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { db } from '../../lib/db/postgres.js';
import { cache } from '../../lib/db/redis.js';
import { authenticate } from '../../middleware/auth.js';
import { callAdapter } from '../../lib/provider-factory.js';
import type {
  CreateGateRequest,
  UpdateGateRequest,
  LayerRequest,
} from '@layer-ai/sdk';
import { MODEL_REGISTRY } from '@layer-ai/sdk';
import { detectSignificantChanges } from '../../lib/gate-utils.js';

const router: RouterType = Router();

// All routes require authentication (SDK auth with Bearer token)
router.use(authenticate);

// POST / - Create a new gate
router.post('/', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const {
      name,
      description,
      taskType,
      model,
      systemPrompt,
      allowOverrides,
      temperature,
      maxTokens,
      topP,
      tags,
      routingStrategy,
      fallbackModels,
      costWeight,
      latencyWeight,
      qualityWeight,
      reanalysisPeriod,
      taskAnalysis,
    } = req.body as CreateGateRequest;

    if (!name || !model) {
      res.status(400).json({
        error: 'bad_request',
        message: 'Missing required fields: name and model',
      });
      return;
    }

    if (!MODEL_REGISTRY[model]) {
      res
        .status(400)
        .json({ error: 'bad_request', message: `Unsupported model: ${model}` });
      return;
    }

    const existing = await db.getGateByUserAndName(req.userId, name);
    if (existing) {
      res
        .status(409)
        .json({ error: 'conflict', message: `Gate "${name}" already exists` });
      return;
    }

    const gate = await db.createGate(req.userId, {
      name,
      description,
      taskType,
      model,
      systemPrompt,
      allowOverrides,
      temperature,
      maxTokens,
      topP,
      tags,
      routingStrategy,
      fallbackModels,
      costWeight,
      latencyWeight,
      qualityWeight,
      reanalysisPeriod,
      taskAnalysis,
    });

    res.status(201).json(gate);
  } catch (error) {
    console.error('Create gate error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to create gate' });
  }
});

// GET / - List all the gates for user
router.get('/', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const gates = await db.getGatesForUser(req.userId);
    res.json(gates);
  } catch (error) {
    console.error('List gates error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to list gates' });
  }
});

// GET /name/:name - Get a single gate by name
router.get('/name/:name', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const gate = await db.getGateByUserAndName(req.userId, req.params.name);

    if (!gate) {
      res.status(404).json({ error: 'not_found', message: 'Gate not found' });
      return;
    }

    res.json(gate);
  } catch (error) {
    console.error('Get gate by name error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to get gate' });
  }
});

// GET /history - Get history for all gates belonging to the user
router.get('/history', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 100;
    const history = await db.getAllGatesHistory(req.userId, limit);
    res.json(history);
  } catch (error) {
    console.error('Get all gates history error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to fetch history' });
  }
});

// GET /activity - Get activity log for all gates belonging to the user
router.get('/activity', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 100;
    const activity = await db.getAllGatesActivity(req.userId, limit);
    res.json(activity);
  } catch (error) {
    console.error('Get all gates activity error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to fetch activity' });
  }
});

// GET /:id/history - Get history for a specific gate
router.get('/:id/history', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const gate = await db.getGateById(req.params.id);

    if (!gate || gate.userId !== req.userId) {
      res.status(404).json({ error: 'not_found', message: 'Gate not found' });
      return;
    }

    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 100;
    const history = await db.getGateHistory(req.params.id, limit);
    res.json(history);
  } catch (error) {
    console.error('Get gate history error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to fetch history' });
  }
});

// GET /:id/activity - Get activity log for a specific gate
router.get('/:id/activity', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const gate = await db.getGateById(req.params.id);

    if (!gate || gate.userId !== req.userId) {
      res.status(404).json({ error: 'not_found', message: 'Gate not found' });
      return;
    }

    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 100;
    const activity = await db.getGateActivity(req.params.id, limit);
    res.json(activity);
  } catch (error) {
    console.error('Get gate activity error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to fetch activity' });
  }
});

// GET /:id - Get a single gate by ID
router.get('/:id', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const gate = await db.getGateById(req.params.id);

    if (!gate) {
      res.status(404).json({ error: 'not_found', message: 'Gate not found' });
      return;
    }

    if (gate.userId !== req.userId) {
      res.status(404).json({ error: 'not_found', message: 'Gate not found' });
      return;
    }

    res.json(gate);
  } catch (error) {
    console.error('Get gate error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to get gate' });
  }
});

// PATCH /:id - Update a gate by ID
router.patch('/:id', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const {
      name,
      description,
      taskType,
      model,
      systemPrompt,
      allowOverrides,
      temperature,
      maxTokens,
      topP,
      tags,
      routingStrategy,
      fallbackModels,
      costWeight,
      latencyWeight,
      qualityWeight,
      analysisMethod,
      reanalysisPeriod,
      taskAnalysis,
      autoApplyRecommendations,
    } = req.body as UpdateGateRequest;

    const existing = await db.getGateById(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'not_found', message: 'Gate not found' });
      return;
    }

    if (existing.userId !== req.userId) {
      res.status(404).json({ error: 'not_found', message: 'Gate not found' });
      return;
    }

    if (model && !MODEL_REGISTRY[model]) {
      res
        .status(400)
        .json({ error: 'bad_request', message: `Unsupported model: ${model}` });
      return;
    }

    // Detect significant changes before updating
    const changedFields = detectSignificantChanges(existing, {
      name,
      description,
      taskType,
      model,
      systemPrompt,
      temperature,
      maxTokens,
      topP,
      routingStrategy,
      fallbackModels,
      costWeight,
      latencyWeight,
      qualityWeight,
      analysisMethod,
      reanalysisPeriod,
      autoApplyRecommendations,
    });

    const updated = await db.updateGate(req.params.id, {
      name,
      description,
      taskType,
      model,
      systemPrompt,
      allowOverrides,
      temperature,
      maxTokens,
      topP,
      tags,
      routingStrategy,
      fallbackModels,
      costWeight,
      latencyWeight,
      qualityWeight,
      analysisMethod,
      reanalysisPeriod,
      taskAnalysis,
      autoApplyRecommendations,
    });

    // Only create history snapshot if significant changes were detected
    if (updated && changedFields.length > 0) {
      await db.createGateHistory(req.params.id, updated, 'user', changedFields);

      // Log manual update activity with specific changed fields
      await db.createActivityLog(req.params.id, req.userId, 'manual_update', {
        changedFields,
      });
    }

    await cache.invalidateGate(req.userId, existing.name);

    res.json({
      gate: updated,
      hasChanges: changedFields.length > 0,
      changedFields,
    });
  } catch (error) {
    console.error('Update gate error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to update gate' });
  }
});

// DELETE /:id - Delete a gate by ID
router.delete('/:id', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const existing = await db.getGateById(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'not_found', message: 'Gate not found' });
      return;
    }

    if (existing.userId !== req.userId) {
      res.status(404).json({ error: 'not_found', message: 'Gate not found' });
      return;
    }

    await db.deleteGate(req.params.id);
    await cache.invalidateGate(req.userId, existing.name);

    res.status(204).send();
  } catch (error) {
    console.error('Delete gate error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to delete gate' });
  }
});

// POST /test - Test a gate configuration with a sample request
// Can either test a saved gate (by providing gateId) or test an unsaved configuration (by providing gate config)
router.post('/test', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const { gateId, gate: gateOverride, messages, quickTest } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        error: 'bad_request',
        message: 'Missing or invalid messages array',
      });
      return;
    }

    // Get base gate config from database if gateId provided, otherwise use empty base
    let baseGate: Partial<typeof gateOverride> = {};

    if (gateId) {
      const savedGate = await db.getGateById(gateId);
      if (!savedGate) {
        res.status(404).json({ error: 'not_found', message: 'Gate not found' });
        return;
      }
      if (savedGate.userId !== req.userId) {
        res.status(404).json({ error: 'not_found', message: 'Gate not found' });
        return;
      }
      baseGate = savedGate;
    }

    // Merge base gate with overrides (overrides take precedence)
    const finalGate = { ...baseGate, ...gateOverride };

    if (!finalGate.model) {
      res.status(400).json({
        error: 'bad_request',
        message: 'Missing required field: model',
      });
      return;
    }

    const results: {
      primary?: {
        model: string;
        success: boolean;
        latency: number;
        content?: string;
        error?: string;
      };
      fallback?: Array<{
        model: string;
        success: boolean;
        latency: number;
        content?: string;
        error?: string;
      }>;
    } = {};

    // Test primary model
    const primaryStartTime = Date.now();
    try {
      const request: LayerRequest = {
        type: 'chat',
        gateId: finalGate.id,
        model: finalGate.model,
        data: {
          messages,
          systemPrompt: finalGate.systemPrompt,
          temperature: finalGate.temperature,
          maxTokens: finalGate.maxTokens,
          topP: finalGate.topP,
        },
      };

      const response = await callAdapter(request);
      const latency = Date.now() - primaryStartTime;

      results.primary = {
        model: finalGate.model,
        success: true,
        latency,
        content: response.content || 'Test completed successfully',
      };
    } catch (error) {
      const latency = Date.now() - primaryStartTime;
      results.primary = {
        model: finalGate.model,
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test all fallback models (skip if quickTest flag is true)
    if (
      !quickTest &&
      finalGate.fallbackModels &&
      finalGate.fallbackModels.length > 0
    ) {
      results.fallback = [];

      for (const fallbackModel of finalGate.fallbackModels) {
        const fallbackStartTime = Date.now();
        try {
          const request: LayerRequest = {
            type: 'chat',
            gateId: finalGate.id,
            model: fallbackModel,
            data: {
              messages,
              systemPrompt: finalGate.systemPrompt,
              temperature: finalGate.temperature,
              maxTokens: finalGate.maxTokens,
              topP: finalGate.topP,
            },
          };

          const response = await callAdapter(request);
          const latency = Date.now() - fallbackStartTime;

          results.fallback.push({
            model: fallbackModel,
            success: true,
            latency,
            content: response.content || 'Test completed successfully',
          });
        } catch (error) {
          const latency = Date.now() - fallbackStartTime;
          results.fallback.push({
            model: fallbackModel,
            success: false,
            latency,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Test gate error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to test gate' });
  }
});

// POST /suggestions - Get AI-powered model suggestions for a gate
router.post('/suggestions', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const { description, costWeight, latencyWeight, qualityWeight } = req.body;

    if (!description) {
      res.status(400).json({
        error: 'bad_request',
        message: 'Gate must have a description for AI recommendations',
      });
      return;
    }

    const userPreferences = {
      costWeight: parseFloat(costWeight ?? '0.33'),
      latencyWeight: parseFloat(latencyWeight ?? '0.33'),
      qualityWeight: parseFloat(qualityWeight ?? '0.34'),
    };

    const { analyzeTask } = await import('../../services/task-analysis.js');
    const suggestions = await analyzeTask(description, userPreferences);

    res.json(suggestions);
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch suggestions',
    });
  }
});

// POST /:id/rollback - Rollback gate to a previous configuration from history
router.post('/:id/rollback', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const { historyId } = req.body;

    if (!historyId) {
      res.status(400).json({
        error: 'bad_request',
        message: 'Missing required field: historyId',
      });
      return;
    }

    const gate = await db.getGateById(req.params.id);

    if (!gate) {
      res.status(404).json({ error: 'not_found', message: 'Gate not found' });
      return;
    }

    if (gate.userId !== req.userId) {
      res.status(404).json({ error: 'not_found', message: 'Gate not found' });
      return;
    }

    // Rollback the gate to the historical configuration
    const updated = await db.rollbackGate(req.params.id, historyId, req.userId);

    if (!updated) {
      res
        .status(404)
        .json({ error: 'not_found', message: 'History entry not found' });
      return;
    }

    await cache.invalidateGate(req.userId, gate.name);

    res.json(updated);
  } catch (error) {
    console.error('Rollback gate error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to rollback gate' });
  }
});

export default router;
