# Release Notes: v1.0.0

## Breaking Changes - Package Split

Layer AI v1.0.0 introduces a major architectural change: the SDK has been split into two focused packages.

### What Changed?

**Before (v0.x):**

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({ apiKey: 'key', adminMode: true });

// Both inference and admin operations in one package
await layer.complete({ gate: 'my-gate', messages: [...] });
await layer.gates.create({ name: 'new-gate', ... });
```

**After (v1.0.0):**

```typescript
// Inference operations - lightweight, focused
import { Layer } from '@layer-ai/sdk';
const layer = new Layer({ apiKey: 'key' });
await layer.complete({ gate: 'gate-id', data: { messages: [...] } });

// Admin operations - separate package
import { LayerAdmin } from '@layer-ai/admin';
const admin = new LayerAdmin({ apiKey: 'admin-key' });
await admin.gates.create({ name: 'new-gate', ... });
```

### Why?

1. **Smaller Bundle Size**: Inference-only apps don't need admin code (~100KB savings)
2. **Clearer Separation**: Different concerns in different packages
3. **Better Security**: Separate API keys for inference vs admin operations
4. **Industry Standard**: Matches patterns from Anthropic, OpenAI, Google

## New Packages

### @layer-ai/sdk v1.0.1 (Inference Only)

**Purpose:** LLM completions and inference operations

**Size:** ~50KB (down from ~150KB)

**API:**

- ✅ `layer.complete()` - Make inference requests
- ✅ `layer.models.*` - Model registry utilities
- ✅ All types exported
- ❌ Admin methods removed (moved to @layer-ai/admin)

**Installation:**

```bash
npm install @layer-ai/sdk@^1.0.1
```

### @layer-ai/admin v0.1.0 (Management Operations)

**Purpose:** Managing gates, keys, and analytics

**Size:** ~80KB

**API:**

- ✅ `admin.gates.*` - Gate management
- ✅ `admin.keys.*` - API key management
- ✅ `admin.logs.*` - Request logs and analytics

**Installation:**

```bash
npm install @layer-ai/admin@^0.1.0
```

## Migration Required

All v0.x users must migrate to v1.0.0. See [MIGRATION_V1.md](./MIGRATION_V1.md) for detailed instructions.

### Key Migration Steps

1. **Install new packages:**

   ```bash
   npm uninstall @layer-ai/sdk
   npm install @layer-ai/sdk@^1.0.1 @layer-ai/admin@^0.1.0
   ```

2. **Update imports:**

   ```typescript
   // Inference
   import { Layer } from '@layer-ai/sdk';

   // Admin
   import { LayerAdmin } from '@layer-ai/admin';
   ```

3. **Use gate IDs instead of names:**

   ```typescript
   // ❌ Old
   await layer.complete({ gate: 'my-gate-name', ... });

   // ✅ New
   await layer.complete({ gate: '123e4567-...', data: { ... } });
   ```

4. **Wrap messages in data object:**

   ```typescript
   // ❌ Old
   { gate: 'id', messages: [...] }

   // ✅ New
   { gate: 'id', data: { messages: [...] } }
   ```

## Other Breaking Changes

### Gate Identification

- **All operations now require gate IDs (UUIDs)**
- Gate names only used during creation: `admin.gates.create({ name: 'my-gate', ... })`
- Find gate IDs in dashboard: `https://uselayer.ai/dashboard/gates`

### Request Format

The `complete()` method now uses a structured format with `data` wrapper:

```typescript
await layer.complete({
  gate: 'gate-id',
  data: {
    messages: [...],
    temperature: 0.7,
    maxTokens: 500
  }
});
```

### Response Format

Response structure remains the same:

```typescript
{
  content: string;
  model: string;
  usage: {
    (promptTokens, completionTokens, totalTokens);
  }
  cost: number;
  latencyMs: number;
}
```

## New Features

### Database Migrations

The SDK now includes database migrations for self-hosting:

```bash
cd node_modules/@layer-ai/core
npm run migrate
```

### Improved Type Exports

All types are now properly exported from `@layer-ai/sdk`:

```typescript
import type {
  Gate,
  GateConfig,
  Log,
  ApiKey,
  SupportedModel,
  LayerRequest,
  LayerResponse,
} from '@layer-ai/sdk';
```

## Deprecations

### Removed in v1.0.0

- `adminMode` config option (use `@layer-ai/admin` instead)
- `layer.gates.*` methods (moved to `admin.gates.*`)
- `layer.keys.*` methods (moved to `admin.keys.*`)
- `layer.logs.*` methods (moved to `admin.logs.*`)
- Gate name-based operations (use IDs everywhere except creation)

## Documentation

### New Documentation

- [MIGRATION_V1.md](./MIGRATION_V1.md) - Complete migration guide
- [packages/sdk/README.md](./packages/sdk/README.md) - Updated SDK docs
- [packages/admin/README.md](./packages/admin/README.md) - New admin package docs

### Updated Documentation

- [README.md](./README.md) - Main project README
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development setup guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines

## Compatibility

### Version Matrix

| Package           | Version  | Status        |
| ----------------- | -------- | ------------- |
| `@layer-ai/sdk`   | v0.x     | ⚠️ Deprecated |
| `@layer-ai/sdk`   | v1.0.0+  | ✅ Current    |
| `@layer-ai/admin` | v0.1.0+  | ✅ Current    |
| `@layer-ai/core`  | v0.8.18+ | 🔧 Internal   |

### Node.js Support

- **Minimum:** Node.js 18+
- **Recommended:** Node.js 20+
- **Tested:** Node.js 18, 20, 22

### Breaking Change Timeline

- **v0.8.x**: Final v0 release (deprecated)
- **v1.0.0**: Current stable release
- **v1.1.0+**: Future non-breaking improvements

## Upgrade Path

### For Inference-Only Applications

If you only use `layer.complete()`:

```bash
npm install @layer-ai/sdk@^1.0.1
```

Update your code to use gate IDs and the new request format. No need to install `@layer-ai/admin`.

### For Admin Applications

If you manage gates, keys, or logs:

```bash
npm install @layer-ai/admin@^0.1.0
```

Import `LayerAdmin` and update method calls from `layer.gates.*` to `admin.gates.*`.

### For Full-Stack Applications

Install both packages:

```bash
npm install @layer-ai/sdk@^1.0.1 @layer-ai/admin@^0.1.0
```

Separate your inference operations (use SDK) from management operations (use Admin).

## Support

### Getting Help

- 📖 **Migration Guide**: [MIGRATION_V1.md](./MIGRATION_V1.md)
- 📖 **SDK Documentation**: [packages/sdk/README.md](./packages/sdk/README.md)
- 📖 **Admin Documentation**: [packages/admin/README.md](./packages/admin/README.md)
- 💬 **GitHub Issues**: [github.com/micah-nettey/layer-ai/issues](https://github.com/micah-nettey/layer-ai/issues)
- 💬 **GitHub Discussions**: [github.com/micah-nettey/layer-ai/discussions](https://github.com/micah-nettey/layer-ai/discussions)
- 🌐 **Dashboard**: [uselayer.ai](https://uselayer.ai)

### Reporting Issues

If you encounter issues during migration:

1. Check [MIGRATION_V1.md](./MIGRATION_V1.md) troubleshooting section
2. Search existing [GitHub Issues](https://github.com/micah-nettey/layer-ai/issues)
3. Open a new issue with:
   - Your current version
   - Error messages
   - Code samples
   - Expected vs actual behavior

## Thank You

Thank you for using Layer AI! This release represents a significant improvement in the SDK's architecture and developer experience. We're committed to making migration as smooth as possible.

If you have feedback or suggestions, please open a [GitHub Discussion](https://github.com/micah-nettey/layer-ai/discussions).

---

**Full Changelog**: [v0.8.18...v1.0.0](https://github.com/micah-nettey/layer-ai/compare/v0.8.18...v1.0.0)
