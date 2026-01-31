import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { db } from '../../lib/db/postgres.js';
import { authenticate } from '../../middleware/auth.js';
import { callAdapter, normalizeModelId } from '../../lib/provider-factory.js';
import type {
  LayerRequest,
  LayerResponse,
  Gate,
  SupportedModel,
  OverrideConfig,
  TextToSpeechRequest,
} from '@layer-ai/sdk';
import { OverrideField } from '@layer-ai/sdk';

const router: RouterType = Router();

// MARK:- Types

interface RoutingResult {
  result: LayerResponse;
  modelUsed: SupportedModel;
}

// MARK:- Helper Functions

function isOverrideAllowed(
  allowOverrides: boolean | OverrideConfig | undefined | null,
  field: keyof OverrideConfig
): boolean {
  if (
    allowOverrides === undefined ||
    allowOverrides === null ||
    allowOverrides === true
  )
    return true;
  if (allowOverrides === false) return false;
  return allowOverrides[field] ?? false;
}

function resolveFinalRequest(
  gateConfig: Gate,
  request: LayerRequest
): LayerRequest {
  let finalModel = gateConfig.model;

  if (
    request.model &&
    isOverrideAllowed(gateConfig.allowOverrides, OverrideField.Model)
  ) {
    try {
      finalModel = normalizeModelId(request.model);
    } catch {
      finalModel = gateConfig.model;
    }
  }

  // For TTS, we don't merge gate config like we do for chat
  return {
    ...request,
    type: 'tts',
    model: normalizeModelId(finalModel),
  } as LayerRequest;
}

function getModelsToTry(
  gateConfig: Gate,
  primaryModel: SupportedModel
): SupportedModel[] {
  const modelsToTry: SupportedModel[] = [primaryModel];

  if (
    gateConfig.routingStrategy === 'fallback' &&
    gateConfig.fallbackModels?.length
  ) {
    modelsToTry.push(...gateConfig.fallbackModels);
  }

  return modelsToTry;
}

async function executeWithFallback(
  request: LayerRequest,
  modelsToTry: SupportedModel[],
  userId?: string
): Promise<RoutingResult> {
  let result: LayerResponse | null = null;
  let lastError: Error | null = null;
  let modelUsed: SupportedModel = request.model as SupportedModel;

  for (const modelToTry of modelsToTry) {
    try {
      const modelRequest = { ...request, model: modelToTry };
      result = await callAdapter(modelRequest, userId);
      modelUsed = modelToTry;
      break;
    } catch (error) {
      lastError = error as Error;
      console.log(
        `Model ${modelToTry} failed, trying next fallback...`,
        error instanceof Error ? error.message : error
      );
      continue;
    }
  }

  if (!result) {
    throw lastError || new Error('All models failed');
  }

  return { result, modelUsed };
}

async function executeWithRoundRobin(
  gateConfig: Gate,
  request: LayerRequest,
  userId?: string
): Promise<RoutingResult> {
  if (!gateConfig.fallbackModels?.length) {
    const result = await callAdapter(request, userId);
    return { result, modelUsed: request.model as SupportedModel };
  }

  const allModels = [gateConfig.model, ...gateConfig.fallbackModels];
  const modelIndex = Math.floor(Math.random() * allModels.length);
  const selectedModel = allModels[modelIndex];

  const modelRequest = { ...request, model: selectedModel };
  const result = await callAdapter(modelRequest, userId);

  return { result, modelUsed: selectedModel };
}

async function executeWithRouting(
  gateConfig: Gate,
  request: LayerRequest,
  userId?: string
): Promise<RoutingResult> {
  const modelsToTry = getModelsToTry(
    gateConfig,
    request.model as SupportedModel
  );

  switch (gateConfig.routingStrategy) {
    case 'fallback':
      return await executeWithFallback(request, modelsToTry, userId);

    case 'round-robin':
      return await executeWithRoundRobin(gateConfig, request, userId);

    case 'single':
    default:
      const result = await callAdapter(request, userId);
      return { result, modelUsed: request.model as SupportedModel };
  }
}

// MARK:- Route Handler

router.post('/', authenticate, async (req: Request, res: Response) => {
  const startTime = Date.now();

  if (!req.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing user ID' });
    return;
  }
  const userId = req.userId;

  let gateConfig: Gate | null = null;
  let request: LayerRequest | null = null;

  try {
    const rawRequest = req.body;

    if (!rawRequest.gateId) {
      res.status(400).json({
        error: 'bad_request',
        message: 'Missing required field: gateId',
      });
      return;
    }

    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        rawRequest.gateId
      );
    if (!isUUID) {
      res
        .status(400)
        .json({ error: 'bad_request', message: 'gateId must be a valid UUID' });
      return;
    }

    gateConfig = await db.getGateByUserAndId(userId, rawRequest.gateId);
    if (!gateConfig) {
      res.status(404).json({
        error: 'not_found',
        message: `Gate with ID "${rawRequest.gateId}" not found`,
      });
      return;
    }

    // Validate TTS-specific fields
    if (
      !rawRequest.data?.input ||
      typeof rawRequest.data.input !== 'string' ||
      rawRequest.data.input.trim().length === 0
    ) {
      res.status(400).json({
        error: 'bad_request',
        message:
          'Missing required field: data.input (must be a non-empty string)',
      });
      return;
    }

    // Warn if gate is configured for a different task type
    if (gateConfig.taskType && gateConfig.taskType !== 'tts') {
      console.warn(
        `[Type Mismatch] Gate "${gateConfig.name}" (${gateConfig.id}) configured for taskType="${gateConfig.taskType}" ` +
          `but received request to /v3/tts endpoint. Processing as TTS request.`
      );
    }

    request = {
      gateId: rawRequest.gateId,
      type: 'tts',
      data: rawRequest.data,
      model: rawRequest.model,
      metadata: rawRequest.metadata,
    } as LayerRequest;

    const finalRequest = resolveFinalRequest(gateConfig, request);
    const { result, modelUsed } = await executeWithRouting(
      gateConfig,
      finalRequest,
      userId
    );

    const latencyMs = Date.now() - startTime;

    // Log request to database
    db.logRequest({
      userId,
      gateId: gateConfig.id,
      gateName: gateConfig.name,
      modelRequested: request.model || gateConfig.model,
      modelUsed: modelUsed,
      promptTokens: result.usage?.promptTokens || 0,
      completionTokens: result.usage?.completionTokens || 0,
      totalTokens: result.usage?.totalTokens || 0,
      costUsd: result.cost || 0,
      latencyMs,
      success: true,
      errorMessage: null,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || null,
    }).catch((err) => console.error('Failed to log request:', err));

    // Return LayerResponse with additional metadata
    const response: LayerResponse = {
      ...result,
      model: modelUsed,
      latencyMs,
    };

    res.json(response);
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    db.logRequest({
      userId,
      gateId: gateConfig?.id || null,
      gateName: req.body?.gate || null,
      modelRequested: request?.model || gateConfig?.model || 'unknown',
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
    }).catch((err) => console.error('Failed to log request:', err));

    console.error('TTS error:', error);
    res.status(500).json({ error: 'internal_error', message: errorMessage });
  }
});

export default router;
