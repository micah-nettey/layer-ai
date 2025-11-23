import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { db } from '../lib/db/postgres.js'; 
import { cache } from '../lib/db/redis.js';
import { authenticate } from '../middleware/auth.js';
import * as openai from '../services/providers/openai.js';
import * as anthropic from '../services/providers/anthropic.js';
import * as google from '../services/providers/google.js';
import type { CompletionRequest, CompletionResponse, Gate, Message, SupportedModel, OverrideConfig } from '@layer/types';
import { MODEL_REGISTRY } from '@layer/types';

const router: RouterType = Router();

// MARK:- Helpers

function isOverrideAllowed(allowOverrides: boolean | OverrideConfig | undefined, field: keyof OverrideConfig): boolean {
  if (allowOverrides === undefined || allowOverrides === true) return true;
  if (allowOverrides === false) return false;
  return allowOverrides[field] ?? false;
}

// POST /v1/complete
router.post('/', authenticate, async (req: Request, res: Response) => {
  const startTime = Date.now(); 

  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID'});
    return;
  }
  const userId = req.userId;

  try {
    const { gate: gateName, messages, model, temperature, maxTokens, topP } = req.body as CompletionRequest;
    
    if (!gateName) {
      res.status(400).json({ error: 'bad_request', message: 'Missing required field: gate' });
      return;
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'bad_request', message: 'Missing required field: messages' });
      return;
    }

    let gateConfig = await cache.getGate(userId, gateName);

    if (!gateConfig) {
      gateConfig = await db.getGateByUserAndName(userId, gateName);
      if(!gateConfig) {
        res.status(400).json({ error: 'not_found', message: `Gate "${gateName}" not found` });
        return;
      }
      await cache.setGate(userId, gateName, gateConfig);
    }

    // Determine final model (check if override is allowed)
    const finalModel = (model && isOverrideAllowed(gateConfig.allowOverrides, 'model') && MODEL_REGISTRY[model as SupportedModel])
      ? model as SupportedModel
      : gateConfig.model;

    const provider = MODEL_REGISTRY[finalModel].provider;
    let result: openai.ProviderResponse;

    const finalParams = {
      model: finalModel,
      messages,
      temperature: isOverrideAllowed(gateConfig.allowOverrides, 'temperature') ? (temperature ?? gateConfig.temperature) : gateConfig.temperature, // change this to not use strings hardcoded
      maxTokens: isOverrideAllowed(gateConfig.allowOverrides, 'maxTokens') ? (maxTokens ?? gateConfig.maxTokens) : gateConfig.maxTokens,
      topP: isOverrideAllowed(gateConfig.allowOverrides, 'topP') ? (topP ?? gateConfig.topP) : gateConfig.topP,
      systemPrompt: gateConfig.systemPrompt,
    };

    switch (provider) {
      case 'openai': 
        result = await openai.createCompletion(finalParams);
        break;
      case 'anthropic': 
        result = await anthropic.createCompletion(finalParams);
        break;
      case 'google':
        result = await google.createCompletion(finalParams);
        break;
    }

    const latencyMs = Date.now() - startTime;

    db.logRequest({
      userId,
      gateId: gateConfig.id,
      gateName,
      modelRequested: model || gateConfig.model,
      modelUsed: finalModel,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      costUsd: result.costUsd,
      latencyMs, 
      success: true,
      errorMessage: null,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || null,
    }).catch(err => console.error('Failed to log request:', err));

    const response: CompletionResponse = {
      content: result?.content,
      model: finalModel,
      usage: {
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
      },
    };

    res.json(response);
  } catch(error) {
    const latencyMs = Date.now() - startTime; 
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    db.logRequest({
      userId, 
      gateId: null, 
      gateName: req.body?.gate || null, 
      modelRequested: null, 
      modelUsed: null, 
      promptTokens: 0, 
      completionTokens: 0,
      totalTokens: 0, 
      costUsd: 0, 
      latencyMs, 
      success: false, 
      errorMessage, 
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || null,
    }).catch(err => console.error('Failed to log request:', err));

    console.error('Completion error:', error);
    res.status(500).json({ error: 'internal_error', message: errorMessage });
  }
});

export default router;