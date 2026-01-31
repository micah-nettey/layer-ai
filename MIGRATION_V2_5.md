# Migration Guide: v2.x → v2.5.0

This guide covers the new type-safe methods introduced in SDK v2.5.0 and Core v2.0.5.

## What's New in v2.5.0

Layer SDK now provides **dedicated type-safe methods** for each AI modality:

- `layer.chat()` - Chat completions
- `layer.image()` - Image generation
- `layer.video()` - Video generation
- `layer.embeddings()` - Text embeddings
- `layer.tts()` - Text-to-speech
- `layer.ocr()` - Document processing/OCR

### Benefits

✅ **Full TypeScript type safety** - Each method has specific request/response types
✅ **Better IDE autocomplete** - IntelliSense shows only relevant fields for each modality
✅ **Self-documenting code** - Clear intent at call site (`layer.chat()` vs `layer.complete()`)
✅ **Aligns with industry standards** - Matches OpenAI, Anthropic, and Google SDKs
✅ **Independent evolution** - Each modality can evolve separately without breaking others

## Breaking Changes

**None!** This is a backwards-compatible release.

- The `complete()` method continues to work exactly as before
- All existing code will work without modifications
- v2 API endpoint (`/v2/complete`) remains unchanged

## Recommended Migration Path

While not required, we recommend migrating to the new type-safe methods for better developer experience.

### Before (v2.x)

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({ apiKey: process.env.LAYER_API_KEY });

// Chat completion
const response = await layer.complete({
  gate: 'my-gate-id',
  type: 'chat', // Generic type field
  data: {
    messages: [{ role: 'user', content: 'Hello' }],
  },
});

// Image generation
const imageResponse = await layer.complete({
  gate: 'image-gate-id',
  type: 'image',
  data: {
    prompt: 'A sunset over mountains',
  },
});
```

### After (v2.5.0+)

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({ apiKey: process.env.LAYER_API_KEY });

// Chat completion - dedicated method with type safety
const response = await layer.chat({
  gateId: 'my-gate-id', // Note: changed from 'gate' to 'gateId'
  data: {
    messages: [{ role: 'user', content: 'Hello' }],
  },
});

// Image generation - dedicated method
const imageResponse = await layer.image({
  gateId: 'image-gate-id',
  data: {
    prompt: 'A sunset over mountains',
  },
});
```

### Key Differences

1. **Parameter name changed**: `gate` → `gateId` (for clarity)
2. **No `type` field needed**: The method name determines the type
3. **Type-specific validation**: Each method validates its specific requirements

## Migration Examples

### Chat Completions

```typescript
// Before
const response = await layer.complete({
  gate: 'chat-gate-id',
  type: 'chat',
  data: {
    messages: [
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hello' },
    ],
    temperature: 0.7,
  },
});

// After
const response = await layer.chat({
  gateId: 'chat-gate-id',
  data: {
    messages: [
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hello' },
    ],
    temperature: 0.7,
  },
});
```

### Image Generation

```typescript
// Before
const response = await layer.complete({
  gate: 'image-gate-id',
  type: 'image',
  data: {
    prompt: 'A futuristic cityscape',
    size: '1024x1024',
    quality: 'hd',
  },
});

// After
const response = await layer.image({
  gateId: 'image-gate-id',
  data: {
    prompt: 'A futuristic cityscape',
    size: '1024x1024',
    quality: 'hd',
  },
});
```

### Embeddings

```typescript
// Before
const response = await layer.complete({
  gate: 'embeddings-gate-id',
  type: 'embeddings',
  data: {
    input: 'Text to embed',
  },
});

// After
const response = await layer.embeddings({
  gateId: 'embeddings-gate-id',
  data: {
    input: 'Text to embed',
  },
});

// Multiple texts
const response = await layer.embeddings({
  gateId: 'embeddings-gate-id',
  data: {
    input: ['Text 1', 'Text 2', 'Text 3'],
  },
});
```

### Text-to-Speech

```typescript
// Before
const response = await layer.complete({
  gate: 'tts-gate-id',
  type: 'tts',
  data: {
    input: 'Hello, world!',
    voice: 'alloy',
  },
});

// After
const response = await layer.tts({
  gateId: 'tts-gate-id',
  data: {
    input: 'Hello, world!',
    voice: 'alloy',
  },
});

console.log(response.audio.base64); // Base64 audio data
console.log(response.audio.format); // e.g., 'mp3'
```

### OCR / Document Processing

```typescript
// Before
const response = await layer.complete({
  gate: 'ocr-gate-id',
  type: 'ocr',
  data: {
    documentUrl: 'https://example.com/document.pdf',
  },
});

// After
const response = await layer.ocr({
  gateId: 'ocr-gate-id',
  data: {
    documentUrl: 'https://example.com/document.pdf',
  },
});

// Or with image
const response = await layer.ocr({
  gateId: 'ocr-gate-id',
  data: {
    imageUrl: 'https://example.com/receipt.jpg',
  },
});
```

## TypeScript Benefits

The new methods provide full type safety with discriminated unions:

```typescript
// TypeScript knows exactly what fields are available
const chatResponse = await layer.chat({
  gateId: 'chat-gate',
  data: {
    messages: [...],  // ✅ Required for chat
    // prompt: '...'  // ❌ TypeScript error - not valid for chat
  }
});

const imageResponse = await layer.image({
  gateId: 'image-gate',
  data: {
    prompt: '...',    // ✅ Required for image
    // messages: [...] // ❌ TypeScript error - not valid for image
  }
});
```

## API Endpoints

The SDK now uses dedicated v3 API endpoints:

- `POST /v3/chat` - Chat completions
- `POST /v3/image` - Image generation
- `POST /v3/video` - Video generation
- `POST /v3/embeddings` - Text embeddings
- `POST /v3/tts` - Text-to-speech
- `POST /v3/ocr` - OCR / document processing

The v2 endpoint (`POST /v2/complete`) remains available for the `complete()` method.

## Response Types

Response formats remain consistent across both old and new methods:

```typescript
{
  content?: string;           // Text content (chat, ocr)
  imageUrl?: string;          // Image URL (image)
  videoUrl?: string;          // Video URL (video)
  embeddings?: number[][];    // Embedding vectors (embeddings)
  audio?: {                   // Audio data (tts)
    base64: string;
    format: string;
  };
  model: string;              // Model used
  finishReason?: string;      // Completion reason
  usage?: {                   // Token usage
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;              // Request cost in USD
  latencyMs?: number;         // Request latency
}
```

## Task Type Normalization (Bonus Fix)

v2.5.0 also includes a fix for task type naming consistency:

**UI now shows internal types with friendly descriptions:**

- `tts` (Text-to-Speech) instead of "Text-to-Speech"
- `document` (OCR, Processing) instead of "Document Processing"
- `stt` (Speech-to-Text) instead of "Speech-to-Text"

**Database migration 021** normalizes existing gate task types to use internal names consistently.

## Need Help?

- 📖 [SDK Documentation](./packages/sdk/README.md)
- 🐛 [Report Issues](https://github.com/layer-ai/layer-ai/issues)
- 💬 [Discussions](https://github.com/layer-ai/layer-ai/discussions)

## Deprecation Timeline

**No deprecation planned.** The `complete()` method will remain available indefinitely for backwards compatibility. However, we recommend using the new type-safe methods for new projects and gradually migrating existing code when convenient.
