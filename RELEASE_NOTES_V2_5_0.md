# Release Notes: v2.5.0

**Release Date:** January 27, 2026

## 🎉 Major Features

### Type-Safe SDK Methods

We've introduced **dedicated type-safe methods** for each AI modality, providing a superior developer experience with full TypeScript support, better IDE autocomplete, and self-documenting code.

#### New Methods

```typescript
// ✨ Chat completions
const response = await layer.chat({
  gateId: 'my-chat-gate',
  data: { messages: [...] }
});

// 🎨 Image generation
const imageResponse = await layer.image({
  gateId: 'my-image-gate',
  data: { prompt: 'A sunset over mountains' }
});

// 🎬 Video generation
const videoResponse = await layer.video({
  gateId: 'my-video-gate',
  data: { prompt: 'A timelapse of clouds' }
});

// 📊 Text embeddings
const embeddingsResponse = await layer.embeddings({
  gateId: 'my-embeddings-gate',
  data: { input: 'Text to embed' }
});

// 🔊 Text-to-speech
const ttsResponse = await layer.tts({
  gateId: 'my-tts-gate',
  data: { input: 'Hello, world!', voice: 'alloy' }
});

// 📄 OCR / Document processing
const ocrResponse = await layer.ocr({
  gateId: 'my-ocr-gate',
  data: { documentUrl: 'https://example.com/doc.pdf' }
});
```

#### Benefits

✅ **Full TypeScript Type Safety** - Discriminated unions ensure correct request/response types
✅ **Better IDE Autocomplete** - IntelliSense shows only relevant fields per modality
✅ **Self-Documenting Code** - Clear intent at call site (`layer.chat()` vs `layer.complete()`)
✅ **Industry Alignment** - Matches patterns from OpenAI, Anthropic, and Google SDKs
✅ **Independent Evolution** - Each modality can evolve separately without breaking changes

### v3 API Endpoints

New dedicated API endpoints provide modality-specific validation:

- `POST /v3/chat` - Chat completions with message array validation
- `POST /v3/image` - Image generation with prompt validation
- `POST /v3/video` - Video generation with prompt validation
- `POST /v3/embeddings` - Text embeddings with string/array validation
- `POST /v3/tts` - Text-to-speech with input validation
- `POST /v3/ocr` - Document processing with URL/base64 validation

Each endpoint validates its specific requirements and returns clear error messages for invalid requests.

## 🐛 Bug Fixes

### Task Type Normalization

Fixed inconsistency between UI display names and internal type names across the system:

**Before:**

- UI showed: "Text-to-Speech", "Document Processing"
- Database stored: Mixed display names and internal types
- Model registry used: `tts`, `document`
- Result: Type mismatch warnings in logs

**After:**

- UI shows: `TTS (Text-to-Speech)`, `Document (OCR, Processing)`
- Database stores: Internal types (`tts`, `document`, `stt`, etc.)
- Model registry uses: Same internal types
- Result: Consistent type handling across the entire system

**Migration 021** automatically normalizes existing gate task_type values.

## 📦 Package Versions

- **@layer-ai/sdk**: v2.4.0 → v2.5.0
- **@layer-ai/core**: v2.0.4 → v2.0.5

## 🔄 Backwards Compatibility

**Zero breaking changes!** All existing code continues to work:

- ✅ `layer.complete()` method remains fully functional
- ✅ `/v2/complete` API endpoint unchanged
- ✅ Existing request/response formats supported
- ✅ All gates and configurations work as before

The new type-safe methods are **additive** - you can adopt them gradually at your own pace.

## 📊 Testing

Comprehensive integration tests verify all new endpoints:

### Embeddings Test Results

```
✅ SDK embeddings() method test passed!
   Duration: 1,299ms
   Model: openai/text-embedding-3-small
   Embeddings count: 1
   First embedding dimensions: 1,536
   Cost: $0.000001
```

### TTS Test Results

```
✅ SDK tts() method test passed!
   Duration: 1,050ms
   Model: openai/tts-1
   Audio format: mp3
   Audio data length: 80,320 characters (base64)
   Cost: $0.000150
```

All v3 endpoints tested and verified with live gates in production.

## 📚 Documentation

- ✅ Updated [SDK README](./packages/sdk/README.md) with all new methods
- ✅ Created [Migration Guide](./MIGRATION_V2_5.md) with examples
- ✅ Added TypeScript usage examples for each modality
- ✅ Documented v3 API endpoints and validation rules

## 🚀 Migration Path

### Recommended (Gradual Migration)

Start using new methods for new code:

```typescript
// New code - use type-safe methods
const response = await layer.chat({
  gateId: 'my-gate-id',
  data: { messages: [...] }
});
```

Keep existing code as-is:

```typescript
// Existing code - still works perfectly
const response = await layer.complete({
  gate: 'my-gate-id',
  data: { messages: [...] }
});
```

### Optional (Full Migration)

Migrate all code to new methods for maximum type safety:

```bash
# Replace gate → gateId
# Replace layer.complete() → layer.chat() (or appropriate method)
# Remove type field (inferred from method name)
```

See [MIGRATION_V2_5.md](./MIGRATION_V2_5.md) for detailed examples.

## 🎯 What's Next?

With the v3 type-safe architecture complete, we're ready for:

1. **Swift SDK** - Clean, type-safe foundation for iOS/macOS SDK
2. **Examples Update** - Update chatbot and content-generator examples
3. **Documentation Expansion** - More real-world patterns and use cases

## 🐛 Known Issues

None at this time.

## 📝 Commits

Key commits in this release:

- `feat: add v3 embeddings, tts, and ocr endpoints (SDK v2.5.0, core v2.0.5)`
- `feat: add v3 chat, image, and video endpoints (SDK v2.4.0, core v2.0.4)`
- `fix: normalize task type values across system (migration 021)`
- `test: add test scripts for v3 embeddings and tts endpoints`

## 💬 Feedback

We'd love to hear your thoughts on the new type-safe methods!

- 🐛 [Report Issues](https://github.com/layer-ai/layer-ai/issues)
- 💡 [Feature Requests](https://github.com/layer-ai/layer-ai/discussions)
- 📧 [Email Support](mailto:micah@uselayer.ai)

---

**Full Changelog:** [v2.4.0...v2.5.0](https://github.com/layer-ai/layer-ai/compare/v2.4.0...v2.5.0)
