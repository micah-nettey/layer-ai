# Migration Guide: v0.x → v1.0.0

This guide will help you migrate from Layer SDK v0.x to v1.0.0. The new version separates inference operations from admin operations for a cleaner, more focused API.

## What Changed?

### 🔄 Two Separate Packages

**v0.x (Old):**

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({ apiKey: 'your-key' });

// Inference
await layer.complete({ gate: 'my-gate', messages: [...] });

// Admin operations (mixed with inference)
await layer.gates.create({ name: 'new-gate', ... });
await layer.gates.update('gate-id', { ... });
await layer.keys.create({ name: 'api-key' });
```

**v1.0.0 (New):**

```typescript
// For inference - lightweight, focused on completions
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({ apiKey: 'your-key' });
await layer.complete({ gate: 'my-gate', messages: [...] });

// For admin operations - separate package
import { LayerAdmin } from '@layer-ai/admin';

const admin = new LayerAdmin({ apiKey: 'your-admin-key' });
await admin.gates.create({ name: 'new-gate', ... });
await admin.gates.update('gate-id', { ... });
await admin.keys.create({ name: 'api-key' });
```

## Breaking Changes

### 1. SDK Package (`@layer-ai/sdk`)

#### Removed Methods

The SDK is now **inference-only**. All admin methods have been removed:

- ❌ `layer.gates.*` - Moved to `@layer-ai/admin`
- ❌ `layer.keys.*` - Moved to `@layer-ai/admin`
- ❌ `layer.logs.*` - Moved to `@layer-ai/admin`

#### What Remains

- ✅ `layer.complete()` - Make inference requests
- ✅ `layer.models.*` - Model registry utilities
- ✅ All types are still exported

### 2. Gate IDs Required Everywhere

**All operations now use gate IDs instead of names:**

```typescript
// ❌ Old (v0.x) - using gate names
await layer.complete({ gate: 'my-gate-name', ... });
await layer.gates.update('my-gate-name', { ... });
await layer.gates.delete('my-gate-name');

// ✅ New (v1.0.0) - using gate IDs
await layer.complete({
  gate: '123e4567-e89b-12d3-a456-426614174000',  // UUID
  data: { ... }
});
await admin.gates.update('123e4567-e89b-12d3-a456-426614174000', { ... });
await admin.gates.delete('123e4567-e89b-12d3-a456-426614174000');
```

**When do you use names?** Only when **creating** a new gate:

```typescript
const gate = await admin.gates.create({
  name: 'my-gate',  // Name used here for creation
  model: 'gpt-4o-mini',
  ...
});
// Returns gate with ID that you use for all future operations
```

Find gate IDs in your dashboard at `https://uselayer.ai/dashboard/gates`

### 3. Request/Response Format

The `complete()` method now uses a structured format:

```typescript
// ❌ Old (v0.x)
const response = await layer.complete({
  gate: 'my-gate',
  messages: [{ role: 'user', content: 'Hello' }],
  temperature: 0.7,
});

// ✅ New (v1.0.0)
const response = await layer.complete({
  gate: 'gate-id',
  data: {
    messages: [{ role: 'user', content: 'Hello' }],
    temperature: 0.7,
  },
});
```

## Migration Steps

### Step 1: Install New Packages

```bash
# Uninstall old SDK
npm uninstall @layer-ai/sdk

# Install new packages
npm install @layer-ai/sdk@^1.0.0        # For inference
npm install @layer-ai/admin@^0.1.0      # For admin operations
```

### Step 2: Update Inference Code

**Before (v0.x):**

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({ apiKey: process.env.LAYER_API_KEY });

const response = await layer.complete({
  gate: 'coding-assistant',
  messages: [{ role: 'user', content: 'Write a hello world function' }],
});

console.log(response.choices[0].message.content);
```

**After (v1.0.0):**

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({ apiKey: process.env.LAYER_API_KEY });

const response = await layer.complete({
  gate: '435282da-4548-4e08-8f9e-a6104803fb8a', // Use gate ID
  data: {
    messages: [{ role: 'user', content: 'Write a hello world function' }],
  },
});

console.log(response.content); // Response format also changed
```

### Step 3: Update Admin Code

**Before (v0.x):**

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({
  apiKey: process.env.LAYER_ADMIN_KEY,
  adminMode: true,
});

// Create a gate
const gate = await layer.gates.create({
  name: 'my-gate',
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a helpful assistant',
});

// List API keys
const keys = await layer.keys.list();

// Get logs
const logs = await layer.logs.list({ limit: 10 });
```

**After (v1.0.0):**

```typescript
import { LayerAdmin } from '@layer-ai/admin';

const admin = new LayerAdmin({
  apiKey: process.env.LAYER_ADMIN_KEY,
});

// Create a gate (name used only for creation)
const gate = await admin.gates.create({
  name: 'my-gate',
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a helpful assistant',
});

console.log(gate.id); // '123e4567-...' - Use this ID for future operations

// Update the gate (using ID)
await admin.gates.update(gate.id, {
  temperature: 0.8,
});

// List API keys
const keys = await admin.keys.list();

// Get logs
const logs = await admin.logs.list({ limit: 10 });
```

### Step 4: Update Type Imports

Types are still available from `@layer-ai/sdk`:

```typescript
import type {
  Gate,
  GateConfig,
  Log,
  ApiKey,
  SupportedModel,
} from '@layer-ai/sdk';
```

## Why This Change?

### Benefits

1. **Smaller Bundle Size** - Inference-only apps don't need admin code
2. **Clearer Separation** - Different concerns in different packages
3. **Better Security** - Separate API keys for inference vs admin operations
4. **Industry Standard** - Matches patterns from Anthropic, OpenAI, Google

### Package Sizes

- `@layer-ai/sdk` v0.x: ~150KB (everything)
- `@layer-ai/sdk` v1.0.0: ~50KB (inference only)
- `@layer-ai/admin` v0.1.0: ~80KB (admin operations)

Most apps only need the SDK for inference, saving ~100KB!

## Common Migration Patterns

### Pattern 1: Chatbot Application

**Before:**

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({ apiKey: process.env.LAYER_API_KEY });

async function chat(message: string) {
  return await layer.complete({
    gate: 'chatbot',
    messages: [{ role: 'user', content: message }],
  });
}
```

**After:**

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({ apiKey: process.env.LAYER_API_KEY });

async function chat(message: string) {
  return await layer.complete({
    gate: process.env.CHATBOT_GATE_ID!, // Store gate ID in env
    data: {
      messages: [{ role: 'user', content: message }],
    },
  });
}
```

### Pattern 2: Admin Dashboard

**Before:**

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({
  apiKey: process.env.LAYER_ADMIN_KEY,
  adminMode: true,
});

// Dashboard code using layer.gates.*, layer.keys.*, etc.
```

**After:**

```typescript
import { LayerAdmin } from '@layer-ai/admin';

const admin = new LayerAdmin({
  apiKey: process.env.LAYER_ADMIN_KEY,
});

// Dashboard code using admin.gates.*, admin.keys.*, etc.
```

### Pattern 3: Full-Stack Application

**Before:**

```typescript
import { Layer } from '@layer-ai/sdk';

// One instance for everything
const layer = new Layer({ apiKey: process.env.LAYER_API_KEY });
```

**After:**

```typescript
import { Layer } from '@layer-ai/sdk';
import { LayerAdmin } from '@layer-ai/admin';

// Separate instances for different purposes
const layer = new Layer({ apiKey: process.env.LAYER_API_KEY });
const admin = new LayerAdmin({ apiKey: process.env.LAYER_ADMIN_KEY });
```

## Troubleshooting

### Error: "Module has no exported member 'gates'"

**Cause:** Trying to use admin methods on the SDK client.

**Solution:** Import and use `LayerAdmin` instead:

```typescript
import { LayerAdmin } from '@layer-ai/admin';
const admin = new LayerAdmin({ apiKey: 'your-key' });
```

### Error: "Gate not found"

**Cause:** Using a gate name instead of gate ID.

**Solution:** Use the gate UUID from your dashboard:

```typescript
// ❌ Wrong
gate: 'my-gate-name';

// ✅ Correct
gate: '435282da-4548-4e08-8f9e-a6104803fb8a';
```

### Error: "Missing required field: data.messages"

**Cause:** Not wrapping messages in a `data` object.

**Solution:**

```typescript
// ❌ Wrong
{ gate: 'id', messages: [...] }

// ✅ Correct
{ gate: 'id', data: { messages: [...] } }
```

## Need Help?

- 📖 [SDK Documentation](https://github.com/anthropics/layer-ai)
- 📖 [Admin Documentation](https://github.com/anthropics/layer-ai/tree/main/packages/admin)
- 💬 [GitHub Issues](https://github.com/anthropics/layer-ai/issues)
- 🌐 [Dashboard](https://uselayer.ai)

## Version Compatibility

| Package           | Version | Status          |
| ----------------- | ------- | --------------- |
| `@layer-ai/sdk`   | v0.x    | ⚠️ Deprecated   |
| `@layer-ai/sdk`   | v1.0.0+ | ✅ Current      |
| `@layer-ai/admin` | v0.1.0+ | ✅ Current      |
| `@layer-ai/core`  | v0.x    | 🔧 Internal use |
