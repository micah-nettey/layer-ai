import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { db } from '../lib/db/postgres.js'; 
import { cache } from '../lib/db/redis.js';
import { authenticate } from '../middleware/auth.js';
import * as openai from '../services/providers/openai.js';
import * as anthropic from '../services/providers/anthropic.js';
import * as google from '../services/providers/google.js';
import type { CompletionRequest, CompletionResponse, Gate, Message, SupportedModel, OverrideConfig } from '@layer-ai/types';
import { MODEL_REGISTRY } from '@layer-ai/types';

const router: RouterType = Router();

// MARK:- Helpers

function isOverrideAllowed(allowOverrides: boolean | OverrideConfig | undefined | null, field: keyof OverrideConfig): boolean {
  if (allowOverrides === undefined || allowOverrides === null || allowOverrides === true) return true;
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
        res.status(404).json({ error: 'not_found', message: `Gate "${gateName}" not found` });
        return;
      }
      await cache.setGate(userId, gateName, gateConfig);
    }

    const finalModel = (model && isOverrideAllowed(gateConfig.allowOverrides, 'model') && MODEL_REGISTRY[model as SupportedModel])
      ? model as SupportedModel
      : gateConfig.model;

    const finalParams = {
      model: finalModel,
      messages,
      temperature: isOverrideAllowed(gateConfig.allowOverrides, 'temperature') ? (temperature ?? gateConfig.temperature) : gateConfig.temperature,
      maxTokens: isOverrideAllowed(gateConfig.allowOverrides, 'maxTokens') ? (maxTokens ?? gateConfig.maxTokens) : gateConfig.maxTokens,
      topP: isOverrideAllowed(gateConfig.allowOverrides, 'topP') ? (topP ?? gateConfig.topP) : gateConfig.topP,
      systemPrompt: gateConfig.systemPrompt,
    };

    const modelsToTry: SupportedModel[] = [finalModel];
    if (gateConfig.routingStrategy === 'fallback' && gateConfig.fallbackModels?.length) {
      modelsToTry.push(...gateConfig.fallbackModels);
    }

    let result: openai.ProviderResponse | null = null;
    let lastError: Error | null = null;
    let modelUsed: SupportedModel = finalModel;

    for (const modelToTry of modelsToTry) {
      try {
        const provider = MODEL_REGISTRY[modelToTry].provider;
        const params = { ...finalParams, model: modelToTry };

        switch (provider) {
          case 'openai':
            result = await openai.createCompletion(params);
            break;
          case 'anthropic':
            result = await anthropic.createCompletion(params);
            break;
          case 'google':
            result = await google.createCompletion(params);
            break;
        }

        modelUsed = modelToTry;
        break;
      } catch (error) {
        lastError = error as Error;
        console.log(`Model ${modelToTry} failed, trying next fallback...`, error instanceof Error ? error.message : error);
        continue;
      }
    }

    if (!result) {
      throw lastError || new Error('All models failed');
    }

    const latencyMs = Date.now() - startTime;

    db.logRequest({
      userId,
      gateId: gateConfig.id,
      gateName,
      modelRequested: model || gateConfig.model,
      modelUsed: modelUsed,
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
      model: modelUsed,
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