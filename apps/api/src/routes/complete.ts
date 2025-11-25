import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { db } from '../lib/db/postgres.js';
import { cache } from '../lib/db/redis.js';
import { authenticate } from '../middleware/auth.js';
import * as openai from '../services/providers/openai.js';
import * as anthropic from '../services/providers/anthropic.js';
import * as google from '../services/providers/google.js';
import type { CompletionRequest, CompletionResponse, Gate, SupportedModel, OverrideConfig, BaseCompletionParams } from '@layer-ai/types';
import { MODEL_REGISTRY, OverrideField } from '@layer-ai/types';

const router: RouterType = Router();

// MARK:- Types

interface CompletionParams extends Omit<BaseCompletionParams, 'model'> {
  model: SupportedModel;
}

interface RoutingResult {
  result: openai.ProviderResponse;
  modelUsed: SupportedModel;
}

// MARK:- Helper Functions

function isOverrideAllowed(allowOverrides: boolean | OverrideConfig | undefined | null, field: keyof OverrideConfig): boolean {
  if (allowOverrides === undefined || allowOverrides === null || allowOverrides === true) return true;
  if (allowOverrides === false) return false;
  return allowOverrides[field] ?? false;
}

async function getGateConfig(userId: string, gateName: string): Promise<Gate | null> {
  let gateConfig = await cache.getGate(userId, gateName);

  if (!gateConfig) {
    gateConfig = await db.getGateByUserAndName(userId, gateName);
    if (gateConfig) {
      await cache.setGate(userId, gateName, gateConfig);
    }
  }

  return gateConfig;
}

function resolveFinalParams(
  gateConfig: Gate,
  requestParams: Pick<CompletionRequest, keyof OverrideConfig | 'messages'>
): CompletionParams {
  const { model, temperature, maxTokens, topP, messages } = requestParams;

  let finalModel = gateConfig.model;
  if (model && isOverrideAllowed(gateConfig.allowOverrides, OverrideField.Model) && MODEL_REGISTRY[model as SupportedModel]) {
    finalModel = model as SupportedModel;
  }

  let finalTemperature = gateConfig.temperature;
  if (isOverrideAllowed(gateConfig.allowOverrides, OverrideField.Temperature)) {
    finalTemperature = temperature ?? gateConfig.temperature;
  }

  let finalMaxTokens = gateConfig.maxTokens;
  if (isOverrideAllowed(gateConfig.allowOverrides, OverrideField.MaxTokens)) {
    finalMaxTokens = maxTokens ?? gateConfig.maxTokens;
  }

  let finalTopP = gateConfig.topP;
  if (isOverrideAllowed(gateConfig.allowOverrides, OverrideField.TopP)) {
    finalTopP = topP ?? gateConfig.topP;
  }

  return {
    model: finalModel,
    messages,
    temperature: finalTemperature,
    maxTokens: finalMaxTokens,
    topP: finalTopP,
    systemPrompt: gateConfig.systemPrompt,
  };
}

async function callProvider(params: CompletionParams): Promise<openai.ProviderResponse> {
  const provider = MODEL_REGISTRY[params.model].provider;

  switch (provider) {
    case 'openai':
      return await openai.createCompletion(params);
    case 'anthropic':
      return await anthropic.createCompletion(params);
    case 'google':
      return await google.createCompletion(params);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function getModelsToTry(gateConfig: Gate, primaryModel: SupportedModel): SupportedModel[] {
  const modelsToTry: SupportedModel[] = [primaryModel];

  if (gateConfig.routingStrategy === 'fallback' && gateConfig.fallbackModels?.length) {
    modelsToTry.push(...gateConfig.fallbackModels);
  }

  return modelsToTry;
}

async function executeWithFallback(params: CompletionParams, modelsToTry: SupportedModel[]): Promise<RoutingResult> {
  let result: openai.ProviderResponse | null = null;
  let lastError: Error | null = null;
  let modelUsed: SupportedModel = params.model;

  for (const modelToTry of modelsToTry) {
    try {
      const modelParams = { ...params, model: modelToTry };
      result = await callProvider(modelParams);
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

  return { result, modelUsed };
}

async function executeWithRouting(gateConfig: Gate, params: CompletionParams): Promise<RoutingResult> {
  const modelsToTry = getModelsToTry(gateConfig, params.model);

  switch (gateConfig.routingStrategy) {
    case 'fallback':
      return await executeWithFallback(params, modelsToTry);

    case 'round-robin':
      // TODO: Implement round-robin logic
      return await executeWithFallback(params, modelsToTry);

    case 'single':
    default:
      const result = await callProvider(params);
      return { result, modelUsed: params.model };
  }
}

// MARK:- Route Handler

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

    const gateConfig = await getGateConfig(userId, gateName);
    if (!gateConfig) {
      res.status(404).json({ error: 'not_found', message: `Gate "${gateName}" not found` });
      return;
    }

    const finalParams = resolveFinalParams(gateConfig, { model, temperature, maxTokens, topP, messages });
    const { result, modelUsed } = await executeWithRouting(gateConfig, finalParams);

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
