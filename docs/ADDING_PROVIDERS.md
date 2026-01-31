# Adding New Model Providers

This guide walks through the steps to add a new model provider (like Mistral, Meta, etc.) to the Layer AI platform.

## Overview

Adding a new provider involves three main components:

1. **Model Registry** - Adding provider models to the registry
2. **Provider Adapter** - Creating an adapter to interface with the provider's API
3. **Router Integration** - Connecting the adapter to the complete route

## Prerequisites

- Provider SDK/API client library (if available)
- API credentials for testing
- Understanding of the provider's API structure

## Step 1: Update Model Registry

### 1.1 Install Provider SDK (if available)

```bash
cd packages/core
pnpm add @provider/sdk
```

Example:

```bash
pnpm add @mistralai/mistralai
```

### 1.2 Add Provider to SUPPORTED_PROVIDERS

**File:** `packages/sdk/src/types/model-registry.ts`

```typescript
export const SUPPORTED_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'mistral',
] as const;
//                                                                      ^^^^^^^^ Add here
```

### 1.3 Update Model Sync Script

**File:** `scripts/sync-modules/aimlapi-fetcher.ts`

Add provider name normalization:

```typescript
function normalizeProviderName(developer: string): string | null {
  const lowerDev = developer.toLowerCase().trim();

  if (lowerDev.includes('open') && lowerDev.includes('ai')) return 'openai';
  if (lowerDev.includes('anthropic')) return 'anthropic';
  if (lowerDev.includes('google')) return 'google';
  if (lowerDev.includes('mistral')) return 'mistral'; // Add here

  return null;
}
```

### 1.4 Sync Models from AIMLAPI

Ensure you have these API keys in your `.env`:

- `AIMLAPI_API_KEY`
- `ARTIFICIAL_ANALYSIS_API_KEY`
- `ANTHROPIC_API_KEY`

Run the sync script:

```bash
pnpm run sync:models
```

This will:

- Fetch all models from AIMLAPI
- Filter to your supported providers
- Enrich chat models with benchmarks and performance data
- Update `packages/sdk/src/types/model-registry.ts`

**Result:** The MODEL_REGISTRY will now include all models from the new provider.

## Step 2: Create Provider Adapter

### 2.1 Create Adapter File

**File:** `packages/core/src/services/providers/{provider}-adapter.ts`

Example: `mistral-adapter.ts`

```typescript
import { BaseProviderAdapter } from './base-adapter.js';
import type { LayerRequest, LayerResponse, Role } from '@layer-ai/sdk';
import { Mistral } from '@mistralai/mistralai';

export class MistralAdapter extends BaseProviderAdapter {
  protected provider = 'mistral';
  private client: Mistral;

  constructor() {
    super();
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY not found in environment');
    }
    this.client = new Mistral({ apiKey });
  }

  // Map Layer roles to provider-specific roles
  protected roleMappings: Record<Role, string> = {
    system: 'system',
    user: 'user',
    assistant: 'assistant',
    tool: 'tool',
  };

  async call(request: LayerRequest): Promise<LayerResponse> {
    switch (request.type) {
      case 'chat':
        return this.handleChat(request);
      case 'embeddings':
        return this.handleEmbeddings(request);
      // Add other modalities as needed
      default:
        throw new Error(`Unsupported request type: ${request.type}`);
    }
  }

  private async handleChat(
    request: Extract<LayerRequest, { type: 'chat' }>
  ): Promise<LayerResponse> {
    // Transform Layer request to provider format
    const messages = request.messages.map((msg) => ({
      role: this.mapRole(msg.role),
      content: msg.content,
    }));

    // Call provider API
    const response = await this.client.chat.complete({
      model: request.model,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });

    // Calculate cost using MODEL_REGISTRY
    const cost = this.calculateCost(
      request.model,
      response.usage.prompt_tokens,
      response.usage.completion_tokens
    );

    // Transform to LayerResponse format
    return {
      type: 'chat',
      content: response.choices[0].message.content,
      model: request.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      cost,
      finishReason: this.mapFinishReason(response.choices[0].finish_reason),
    };
  }

  private async handleEmbeddings(
    request: Extract<LayerRequest, { type: 'embeddings' }>
  ): Promise<LayerResponse> {
    // Implement embeddings if provider supports it
    throw new Error('Embeddings not yet implemented for Mistral');
  }
}
```

### 2.2 Key Methods to Implement

| Method                    | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| `call()`                  | Main entry point, routes by request type |
| `handleChat()`            | Chat/completion requests                 |
| `handleImageGeneration()` | Image generation (DALL-E, etc.)          |
| `handleEmbeddings()`      | Text embeddings                          |
| `handleTextToSpeech()`    | TTS requests                             |
| `handleSpeechToText()`    | STT/Whisper requests                     |
| `mapRole()`               | Map Layer roles to provider roles        |
| `mapFinishReason()`       | Normalize finish reasons                 |

**Note:** Only implement modalities your provider supports.

## Step 3: Integrate into Router

### 3.1 Update Complete Route

**File:** `packages/core/src/routes/v2/complete.ts`

Import the new adapter:

```typescript
import { MistralAdapter } from '../../services/providers/mistral-adapter.js';
```

Add case to `callProvider()` function:

```typescript
function callProvider(request: LayerRequest): Promise<LayerResponse> {
  const provider = MODEL_REGISTRY[request.model as SupportedModel].provider;

  switch (provider) {
    case 'openai':
      return new OpenAIAdapter().call(request);
    case 'anthropic':
      return new AnthropicAdapter().call(request);
    case 'google':
      return new GoogleAdapter().call(request);
    case 'mistral': // Add this
      return new MistralAdapter().call(request);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
```

## Step 4: Testing

### 4.1 Add Environment Variable

Add provider API key to `.env`:

```bash
MISTRAL_API_KEY=your_api_key_here
```

### 4.2 Create Test Gate

```bash
curl -X POST http://localhost:3001/v1/gates \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-mistral",
    "model": "mistral-tiny",
    "routing_strategy": "single"
  }'
```

### 4.3 Test Request

```bash
curl -X POST http://localhost:3001/v2/complete \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "gate": "test-mistral",
    "type": "chat",
    "messages": [
      {"role": "user", "content": "Hello, Mistral!"}
    ]
  }'
```

## Common Issues

### Issue: "Provider not found in MODEL_REGISTRY"

**Cause:** Model ID doesn't match registry key.

**Fix:** Check model ID in `MODEL_REGISTRY`. Use exact string from registry.

### Issue: "API key not found"

**Cause:** Environment variable not set.

**Fix:** Add `{PROVIDER}_API_KEY` to `.env` file in both repos.

### Issue: Role mapping errors

**Cause:** Provider has different role names.

**Fix:** Update `roleMappings` in adapter to match provider's expected roles.

### Issue: Finish reason unknown

**Cause:** Provider returns different finish reason strings.

**Fix:** Add mapping in `mapFinishReason()` method.

## Architecture Overview

```
Client Request
     ↓
/v2/complete route
     ↓
Load gate config (model, temperature, etc.)
     ↓
Resolve final model from MODEL_REGISTRY
     ↓
Extract provider from MODEL_REGISTRY[model].provider
     ↓
Switch on provider
     ↓
Instantiate {Provider}Adapter
     ↓
Call adapter.call(request)
     ├─ Transform request to provider format
     ├─ Call provider SDK
     ├─ Calculate cost from MODEL_REGISTRY
     └─ Transform response to LayerResponse
     ↓
Log request to database
     ↓
Return response to client
```

## Reference Implementation

See existing adapters for reference:

- `packages/core/src/services/providers/openai-adapter.ts`
- `packages/core/src/services/providers/anthropic-adapter.ts`
- `packages/core/src/services/providers/google-adapter.ts`

## Summary Checklist

- [ ] Install provider SDK
- [ ] Add provider to `SUPPORTED_PROVIDERS`
- [ ] Update `normalizeProviderName()` in sync script
- [ ] Run `pnpm run sync:models`
- [ ] Create provider adapter class
- [ ] Implement required modality handlers
- [ ] Add adapter to router switch statement
- [ ] Add API key to `.env`
- [ ] Test with sample request
- [ ] Build packages locally
- [ ] Commit changes to git
