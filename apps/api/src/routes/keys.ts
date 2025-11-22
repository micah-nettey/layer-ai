import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import crypto from 'crypto';
import { db } from '../lib/db/postgres.js';
import { authenticate } from '../middleware/auth.js';

const router: RouterType = Router();

// All routes require sdk authentication
router.use(authenticate);

// Generate a random API key
function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `layer_${randomBytes}`;
}

// Hash an API key for storage
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// GET /api/keys - List user's API keys
router.get('/', async (req: Request, res: Response) => {
  try {
    const keys = await db.getApiKeysForUser(req.userId!);
    res.json(keys);
  } catch (error) {
    console.error('Get keys error:', error);
    res.status(500).json({ error: 'internal_error', message: 'Failed to get API keys' });
  }
});

// POST /api/keys - Generate new API key
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ error: 'bad_request', message: 'Key name required' });
      return;
    }

    // Generate key
    const key = generateApiKey();
    const keyHash = hashApiKey(key);
    const keyPrefix = key.substring(0, 12);

    // Store in database
    const apiKey = await db.createApiKey(req.userId!, keyHash, keyPrefix, name);

    // Return full key only once
    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      key: key, // Only returned on creation
      keyPrefix: apiKey.keyPrefix,
      createdAt: apiKey.createdAt,
    });
  } catch (error) {
    console.error('Create key error:', error);
    res.status(500).json({ error: 'internal_error', message: 'Failed to create API key' });
  }
});

// DELETE /api/keys/:id - Delete an API key
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await db.deleteApiKey(id, req.userId!);

    if (!deleted) {
      res.status(404).json({ error: 'not_found', message: 'API key not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete key error:', error);
    res.status(500).json({ error: 'internal_error', message: 'Failed to delete API key' });
  }
});

export default router;