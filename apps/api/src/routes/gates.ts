import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { db } from '../lib/db/postgres.js';
import { cache } from '../lib/db/redis.js';
import { authenticate } from '../middleware/auth.js';
import type { CreateGateRequest, UpdateGateRequest } from '@layer-ai/types';
import { MODEL_REGISTRY } from '@layer-ai/types';

const router: RouterType = Router(); 

// All routes require authentication (SDK auth with Bearer token)
router.use(authenticate);

// POST / - Create a new gate
router.post('/', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID'});
    return;
  }

  try {
    const { name, description, model, systemPrompt, allowOverrides, temperature, maxTokens, topP, tags, routingStrategy, fallbackModels } = req.body as CreateGateRequest;

    if (!name || !model) {
      res.status(400).json({ error: 'bad_request', message: 'Missing required fields: name and model' });
      return;
    }

    if (!MODEL_REGISTRY[model]) {
      res.status(400).json({ error: 'bad_request', message: `Unsupported model: ${model}` });
      return;
    }

    const existing = await db.getGateByUserAndName(req.userId, name);
    if (existing) {
      res.status(409).json({ error: 'conflict', message: `Gate "${name}" already exists` });
      return;
    }

    const gate = await db.createGate(req.userId, {
      name,
      description,
      model,
      systemPrompt,
      allowOverrides,
      temperature,
      maxTokens,
      topP,
      tags,
      routingStrategy,
      fallbackModels,
    });

    res.status(201).json(gate);
  } catch (error) {
    console.error('Create gate error:', error);
    res.status(500).json({ error: 'internal_error', message: 'Failed to create gate'});
  }
});

// GET / - List all the gates for user
router.get('/', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID'});
    return;
  }

  try {
    const gates = await db.getGatesForUser(req.userId);
    res.json(gates);
  } catch (error) {
    console.error('List gates error:', error);
    res.status(500).json({ error: 'internal_error', message: 'Failed to list gates'});
  }
});

// GET /:id - Get a single gate
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
    res.status(500).json({ error: 'internal_error', message: 'Failed to get gate' });
  }
});

// PATCH /:id - Update a gate
router.patch('/:id', async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }

  try {
    const { description, model, systemPrompt, allowOverrides, temperature, maxTokens, topP, tags, routingStrategy, fallbackModels } = req.body as UpdateGateRequest;

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
      res.status(400).json({ error: 'bad_request', message: `Unsupported model: ${model}` });
      return;
    }

    const updated = await db.updateGate(req.params.id, {
      description,
      model,
      systemPrompt,
      allowOverrides,
      temperature,
      maxTokens,
      topP,
      tags,
      routingStrategy,
      fallbackModels,
    });

    await cache.invalidateGate(req.userId, existing.name);

    res.json(updated);
  } catch (error) {
    console.error('Update gate error:', error);
    res.status(500).json({ error: 'internal_error', message: 'Failed to update gate' });
  }
});

// DELETE /:id - Delete a gate
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
    res.status(500).json({ error: 'internal_error', message: 'Failed to delete gate' });
  }
});

export default router;