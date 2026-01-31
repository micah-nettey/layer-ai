# Layer AI Normalization Architecture

> A unified interface for multimodal AI providers

## What is this?

Layer AI acts as a gateway between your application and multiple AI providers (OpenAI, Anthropic, Google, etc.). Each provider has its own API format, field names, and quirks. The normalization layer solves this by providing a single, consistent interface that works across all providers.

Think of it like a universal adapter for AI models—you write your code once, and it works with any provider.

## The Problem We're Solving

```
Your App                    Without Normalization
   |
   |---> OpenAI:    { role: "user", content: "..." }
   |---> Anthropic: { role: "user", content: [...] }  // Different structure!
   |---> Google:    { role: "user", parts: [...] }    // Different field names!
```

Each provider expects different formats, even for the same concepts. This means:

- Writing provider-specific code everywhere
- Complex migration when switching providers
- Difficult to support new providers
- Lots of duplicated logic

## The Solution: Normalization Layer

```
Your App
   |
   v
[Normalized Layer Interface]  ← Single, consistent format based on OpenAI
   |
   |---> [OpenAI Adapter]    → OpenAI API
   |---> [Anthropic Adapter] → Anthropic API
   |---> [Google Adapter]    → Google Gemini API
```

You send requests in one format. The adapters handle the translation.

## How It Works

### 1. Normalized Types (The Contract)

We define a single set of types based on OpenAI's format (since it's widely adopted):

```typescript
// Everyone speaks this language
type Role = 'system' | 'user' | 'assistant' | 'tool' | ...
type ImageSize = '1024x1024' | '1792x1024' | ...
type FinishReason = 'completed' | 'length_limit' | 'tool_call' | ...
```

All providers must map to these normalized types.

### 2. Provider Adapters (The Translators)

Each provider has an adapter that:

- **Receives** normalized requests
- **Translates** to provider-specific format
- **Calls** the provider's API
- **Translates** response back to normalized format

```typescript
// The adapter pattern
class ProviderAdapter {
  // Define mappings for your provider
  protected roleMappings = {
    system: 'system', // OpenAI
    // OR
    system: ADAPTER_HANDLED, // Anthropic (needs special handling)
  };

  // Implement the call method
  async call(request: LayerRequest): Promise<LayerResponse> {
    // 1. Transform normalized request → provider format
    // 2. Call provider API
    // 3. Transform provider response → normalized format
  }
}
```

### 3. Request Flow Diagram

```
┌─────────────────┐
│   Your App      │
│  (SDK/API)      │
└────────┬────────┘
         │
         │ LayerRequest
         │ { type: 'chat',
         │   model: 'gpt-4o',
         │   data: { messages, temperature, ... } }
         │
         v
┌─────────────────┐
│ Routing Layer   │ ← Determines which provider to use
└────────┬────────┘
         │
         v
┌─────────────────┐
│ OpenAI Adapter  │
└────────┬────────┘
         │
         │ 1. Map roles: 'system' → 'system'
         │ 2. Map image detail: 'high' → 'high'
         │ 3. Build OpenAI request
         │
         v
┌─────────────────┐
│  OpenAI API     │
└────────┬────────┘
         │
         │ OpenAI Response
         │
         v
┌─────────────────┐
│ OpenAI Adapter  │
└────────┬────────┘
         │
         │ 1. Map finish reason: 'stop' → 'completed'
         │ 2. Calculate cost
         │ 3. Track latency
         │
         v
┌─────────────────┐
│  Your App       │ ← LayerResponse
│  Gets Response  │   { content, usage, cost, latencyMs, ... }
└─────────────────┘
```

## Key Concepts

### ADAPTER_HANDLED Sentinel

Some fields need special handling per provider. We use a special marker:

```typescript
const ADAPTER_HANDLED = '__ADAPTER_HANDLED__'

// Example: Anthropic handles system messages differently
protected roleMappings = {
  system: ADAPTER_HANDLED,  // Don't map—handle specially in adapter
  user: 'user',             // Direct mapping
}
```

### Graceful Degradation

If a provider doesn't support a feature, we handle it gracefully:

```typescript
// Image detail levels
protected imageDetailMappings = undefined  // Provider doesn't support it
// The field is simply ignored—no error thrown
```

### Three Categories of Fields

1. **Normalized Fields**: Different values across providers
   - Example: `role`, `imageSize`, `finishReason`
   - Require mapping tables

2. **Universal Fields**: Same across providers
   - Example: `temperature`, `maxTokens`, `topP`
   - Passed through directly

3. **Provider-Specific Fields**: Unique to one provider
   - Example: OpenAI's `voice`, Google's `aspectRatio`
   - Flexible strings in V1, will normalize in V2

## Current Architecture: V1

**Status**: ✅ In Production (Migration in Progress)

**What's Included**:

- Normalized types for chat, image, video, embeddings, TTS
- Base adapter class with mapping helpers
- OpenAI adapter (fully implemented)
- Anthropic & Google adapters (legacy, being migrated)

**What's NOT Included (Yet)**:

- Streaming support
- Full function calling normalization (basic support exists)
- Audio input normalization
- Provider-specific field normalization (voice, aspectRatio, etc.)

**Migration Status**:

```
✅ OpenAI    - Using new adapter
⏳ Anthropic - Using legacy implementation
⏳ Google    - Using legacy implementation
```

## Future Versions

### V2: Full Normalization (Planned Q1 2025)

**Goals**:

- Normalize ALL fields, including provider-specific ones
- Add streaming support with normalized events
- Full function calling normalization
- Audio input support
- Better error handling and validation

**Example—Normalizing Voice**:

```typescript
// V1 (current): Provider-specific strings
voice: 'alloy' | 'echo' | ...  // OpenAI-specific

// V2 (future): Normalized voice profiles
voice: 'professional' | 'casual' | 'energetic'
// Adapters map to closest provider voice
```

**Example—Video Sizes**:

```typescript
// V1 (current): Pixel dimensions
size: '1280x720' | '1024x1792' | ...

// V2 (future): Smarter abstractions
size: '720p' | '1080p' | '4k'
aspectRatio: '16:9' | '9:16' | '1:1'
// Adapters map to closest supported resolution
```

### V3: Smart Routing & Optimization (Planned Q2 2025)

**Goals**:

- Automatic provider selection based on request type
- Cost optimization across providers
- Performance-based routing
- Multi-provider fallback chains

**Example**:

```typescript
// Instead of specifying provider
{ model: 'gpt-4o', ... }

// Specify requirements
{
  capabilities: ['vision', 'function_calling'],
  optimize: 'cost',  // or 'speed' or 'quality'
  maxCostPer1k: 0.01
}

// Layer automatically routes to best provider
```

## Migration Guide

### For Contributors: Adding a New Provider

1. **Create adapter file**: `apps/api/src/services/providers/{provider}-adapter.ts`

2. **Extend base adapter**:

```typescript
export class MyProviderAdapter extends ProviderAdapter {
  protected provider = 'myprovider';

  // Define your mappings
  protected roleMappings = { ... };
  protected finishReasonMappings = { ... };

  async call(request: LayerRequest): Promise<LayerResponse> {
    // Implement your adapter
  }
}
```

3. **Create test file**: `test-{provider}-adapter.ts` (see OpenAI example)

4. **Update routing**: Add your adapter to `src/routes/complete.ts`:

```typescript
case 'myprovider': {
  const adapter = new MyProviderAdapter();
  const layerResponse = await adapter.call({ ... });
  return convertToLegacyFormat(layerResponse);
}
```

5. **Test thoroughly**: Run your test file and routing tests

### For Users: No Changes Needed

The migration is transparent. Your existing code continues to work:

```typescript
// This works before, during, and after migration
await layer.chat({
  gate: 'my-gate',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

## Architecture Decisions

### Why Base on OpenAI?

1. **Most widely adopted format**: Developers are familiar with it
2. **Comprehensive**: Supports most features we need
3. **Well-documented**: Easy to understand and learn
4. **Industry standard**: Many tools/libraries use it

### Why Not GraphQL/OpenAPI/etc.?

We need more than just type definitions:

- Runtime mapping logic (role translations, size conversions)
- Provider-specific handling (ADAPTER_HANDLED pattern)
- Cost calculation and tracking
- Graceful degradation

A custom adapter pattern gives us this flexibility.

### Why Adapters vs. Single Service?

**Adapters** (current):

- ✅ Isolated provider logic
- ✅ Easy to add new providers
- ✅ Independent testing
- ✅ Clear separation of concerns

**Single Service** (alternative):

- ❌ God object anti-pattern
- ❌ Hard to maintain
- ❌ Tight coupling
- ❌ Difficult testing

## File Structure

```
packages/sdk/src/types/
├── api-v2.ts              # Normalized types and interfaces

apps/api/src/services/providers/
├── base-adapter.ts        # Abstract base class
├── openai-adapter.ts      # OpenAI implementation ✅
├── anthropic-adapter.ts   # Anthropic (TODO)
├── google-adapter.ts      # Google (TODO)
└── test-openai-adapter.ts # Test examples

apps/api/src/routes/
└── complete.ts            # Routing layer with migration comment
```

## Resources

- **Reference Implementation**: `openai-adapter.ts` - Shows complete adapter pattern
- **Test Examples**: `test-openai-adapter.ts` - How to test all modalities
- **Base Adapter**: `base-adapter.ts` - Mapping helpers and utilities
- **Type Definitions**: `api-v2.ts` - All normalized types

## Questions?

- **"Do I need to migrate my code?"** → No, migration is transparent
- **"Can I use provider-specific features?"** → Yes, through raw passthrough (V1) or normalized fields (V2+)
- **"How do I add a new provider?"** → Follow the migration guide above
- **"What if my provider doesn't support a feature?"** → Set mapping to `undefined`, feature is gracefully ignored

---

_Last Updated: December 2024_
_Current Version: V1 (Migration in Progress)_
