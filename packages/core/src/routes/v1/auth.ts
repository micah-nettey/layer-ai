import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../../lib/db/postgres.js';

const router: RouterType = Router();

// POST /auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({ error: 'bad_request', message: 'Email and password required' });
      return;
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      res
        .status(409)
        .json({ error: 'conflict', message: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.createUser(email, passwordHash);

    res.status(201).json({ id: user.id, email: user.email });
  } catch (error) {
    console.error('Signup error:', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to create account ' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({ error: 'bad_request', message: 'Email and password required' });
      return;
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      res
        .status(401)
        .json({ error: 'unauthorized', message: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res
        .status(401)
        .json({ error: 'unauthorized', message: 'Invalid credentials' });
      return;
    }

    res.json({ id: user.id, email: user.email });
  } catch (error) {
    console.error('Login error', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to login' });
  }
});

// POST /auth/token
router.post('/token', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({ error: 'bad_request', message: 'Email and password required' });
      return;
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      res
        .status(401)
        .json({ error: 'unauthorized', message: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res
        .status(401)
        .json({ error: 'unauthorized', message: 'Invalid credentials' });
      return;
    }

    const rawKey = `layer_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12); // "layer_xxxxxx"

    await db.createApiKey(user.id, keyHash, keyPrefix, 'CLI');

    res.status(201).json({ apiKey: rawKey });
  } catch (error) {
    console.error('api key creation error', error);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Failed to create api key' });
  }
});

export default router;
