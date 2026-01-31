import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { db } from '../../lib/db/postgres.js';
import { cache } from '../../lib/db/redis.js';
import { authenticate } from '../../middleware/auth.js';
import { callAdapter, normalizeModelId } from '../../lib/provider-factory.js';
import type {
  LayerRequest,
  LayerResponse,
  Gate,
  SupportedModel,
  OverrideConfig,
} from '@layer-ai/sdk';
import { MODEL_REGISTRY, OverrideField } from '@layer-ai/sdk';

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

  // Use discriminated union to handle each request type
  switch (request.type) {
    case 'chat': {
      const chatData = { ...request.data };

      if (!chatData.systemPrompt && gateConfig.systemPrompt) {
        chatData.systemPrompt = gateConfig.systemPrompt;
      }

      if (
        chatData.temperature === undefined &&
        gateConfig.temperature !== undefined
      ) {
        chatData.temperature = gateConfig.temperature;
      } else if (
        chatData.temperature !== undefined &&
        !isOverrideAllowed(gateConfig.allowOverrides, OverrideField.Temperature)
      ) {
        chatData.temperature = gateConfig.temperature;
      }

      if (
        chatData.maxTokens === undefined &&
        gateConfig.maxTokens !== undefined
      ) {
        chatData.maxTokens = gateConfig.maxTokens;
      } else if (
        chatData.maxTokens !== undefined &&
        !isOverrideAllowed(gateConfig.allowOverrides, OverrideField.MaxTokens)
      ) {
        chatData.maxTokens = gateConfig.maxTokens;
      }

      if (chatData.topP === undefined && gateConfig.topP !== undefined) {
        chatData.topP = gateConfig.topP;
      } else if (
        chatData.topP !== undefined &&
        !isOverrideAllowed(gateConfig.allowOverrides, OverrideField.TopP)
      ) {
        chatData.topP = gateConfig.topP;
      }

      return {
        ...request,
        model: normalizeModelId(finalModel),
        data: chatData,
      };
    }

    case 'image': {
      // TODO: Future enhancement - intelligently apply gate-level defaults
      // Potential features:
      // - Apply systemPrompt by intelligently merging with user prompt
      // - Support defaults for size, quality, style, count
      // - Make this opt-in with a gate setting (e.g., applySystemPromptToAllTasks)
      return {
        ...request,
        model: normalizeModelId(finalModel),
      };
    }

    case 'video': {
      // TODO: Future enhancement - intelligently apply gate-level defaults
      // Similar to image generation, could support systemPrompt integration
      // and video-specific defaults (duration, size, fps)
      return {
        ...request,
        model: normalizeModelId(finalModel),
      };
    }

    case 'embeddings': {
      // Embeddings are deterministic and don't typically need gate-level defaults
      // beyond model selection (already handled)
      return {
        ...request,
        model: normalizeModelId(finalModel),
      };
    }

    case 'tts': {
      // TODO: Future enhancement - support defaults for voice, speed, format
      return {
        ...request,
        model: normalizeModelId(finalModel),
      };
    }

    case 'ocr': {
      // TODO: Future enhancement - support defaults for tableFormat, includeImageBase64, etc.
      return {
        ...request,
        model: normalizeModelId(finalModel),
      };
    }

    default: {
      // This will cause a TypeScript error if we miss a case
      const exhaustiveCheck: never = request;
      throw new Error(
        `Unhandled request type: ${(exhaustiveCheck as LayerRequest).type}`
      );
    }
  }
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
      res.status(400).json({
        error: 'bad_request',
        message:
          'gateId must be a valid UUID. Gate names are no longer supported.',
      });
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

    // Default to gate's taskType, allow override via request.type
    const requestType = rawRequest.type || gateConfig.taskType;

    // Warn if request type doesn't match gate's taskType (possible misconfiguration)
    if (
      rawRequest.type &&
      gateConfig.taskType &&
      rawRequest.type !== gateConfig.taskType
    ) {
      console.warn(
        `[Type Mismatch] Gate "${gateConfig.name}" (${gateConfig.id}) configured for taskType="${gateConfig.taskType}" ` +
          `but received request with type="${rawRequest.type}". Using request type as override.`
      );
    }

    request = {
      gateId: rawRequest.gateId,
      type: requestType,
      data: rawRequest.data,
      model: rawRequest.model,
      metadata: rawRequest.metadata,
    } as LayerRequest;

    // Validate required fields based on request type
    switch (request.type) {
      case 'chat':
        if (
          !request.data.messages ||
          !Array.isArray(request.data.messages) ||
          request.data.messages.length === 0
        ) {
          res.status(400).json({
            error: 'bad_request',
            message: 'Missing required field: data.messages',
          });
          return;
        }
        break;
      case 'image':
        if (!request.data.prompt) {
          res.status(400).json({
            error: 'bad_request',
            message: 'Missing required field: data.prompt',
          });
          return;
        }
        break;
      case 'video':
        if (!request.data.prompt) {
          res.status(400).json({
            error: 'bad_request',
            message: 'Missing required field: data.prompt',
          });
          return;
        }
        break;
      case 'embeddings':
        if (!request.data.input) {
          res.status(400).json({
            error: 'bad_request',
            message: 'Missing required field: data.input',
          });
          return;
        }
        break;
      case 'tts':
        if (!request.data.input) {
          res.status(400).json({
            error: 'bad_request',
            message: 'Missing required field: data.input',
          });
          return;
        }
        break;
      case 'ocr':
        if (
          !request.data.documentUrl &&
          !request.data.imageUrl &&
          !request.data.base64
        ) {
          res.status(400).json({
            error: 'bad_request',
            message:
              'Missing required field: data must contain one of documentUrl, imageUrl, or base64',
          });
          return;
        }
        break;
    }

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

    console.error('Completion error:', error);
    res.status(500).json({ error: 'internal_error', message: errorMessage });
  }
});

export default router;
