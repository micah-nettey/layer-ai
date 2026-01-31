# @layer-ai/admin

Admin SDK for Layer AI - Manage gates, API keys, and analytics programmatically.

> **Separation of Concerns**: This package handles management operations. For LLM inference, use [`@layer-ai/sdk`](../sdk).

## Installation

```bash
npm install @layer-ai/admin
# or
pnpm add @layer-ai/admin
# or
yarn add @layer-ai/admin
```

## Quick Start

```typescript
import { LayerAdmin } from '@layer-ai/admin';

const admin = new LayerAdmin({
  apiKey: process.env.LAYER_ADMIN_KEY,
});

// Create a gate
const gate = await admin.gates.create({
  name: 'my-gate',
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a helpful assistant',
});

console.log(`Created gate with ID: ${gate.id}`);

// Use the gate ID for completions with @layer-ai/sdk
```

## Configuration

### Constructor Options

```typescript
const admin = new LayerAdmin({
  apiKey: string;        // Required: Your Layer admin API key
  baseUrl?: string;      // Optional: API base URL (default: https://api.uselayer.ai)
});
```

## API Reference

### Gates Management

#### `admin.gates.list()`

List all gates for the authenticated user.

```typescript
const gates = await admin.gates.list();

gates.forEach((gate) => {
  console.log(`${gate.name} (${gate.id}): ${gate.model}`);
});
```

**Returns:** `Gate[]`

#### `admin.gates.get(gateId)`

Get a specific gate by ID.

```typescript
const gate = await admin.gates.get('435282da-4548-4e08-8f9e-a6104803fb8a');

console.log(gate.name);
console.log(gate.model);
console.log(gate.temperature);
```

**Parameters:**

- `gateId` (string): Gate UUID

**Returns:** `Gate`

#### `admin.gates.create(data)`

Create a new gate.

```typescript
const gate = await admin.gates.create({
  name: 'customer-support',
  model: 'gpt-4o',
  description: 'Customer support chatbot',
  systemPrompt: 'You are a helpful customer support agent',
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1.0,
  allowOverrides: ['temperature', 'maxTokens'], // or true for all
  routingStrategy: 'fallback',
  fallbackModels: ['claude-sonnet-4', 'gemini-2.0-flash-exp'],
});

console.log(`Gate ID: ${gate.id}`); // Use this ID for completions
```

**Parameters:**

- `name` (string, required): Gate name (used only for creation)
- `model` (string, required): Primary model
- `description` (string, optional): Gate description
- `systemPrompt` (string, optional): System prompt
- `temperature` (number, optional): Temperature (0-2)
- `maxTokens` (number, optional): Max output tokens
- `topP` (number, optional): Top-p sampling
- `allowOverrides` (boolean | string[], optional): Allow parameter overrides
- `routingStrategy` (string, optional): 'fallback' or 'single'
- `fallbackModels` (string[], optional): Fallback models

**Returns:** `Gate` (includes `id` field)

#### `admin.gates.update(gateId, data)`

Update an existing gate.

```typescript
await admin.gates.update('435282da-4548-4e08-8f9e-a6104803fb8a', {
  temperature: 0.8,
  maxTokens: 1500,
  fallbackModels: ['claude-sonnet-4'],
});
```

**Parameters:**

- `gateId` (string): Gate UUID
- `data` (object): Fields to update (same as create, except `name`)

**Returns:** `Gate`

#### `admin.gates.delete(gateId)`

Delete a gate.

```typescript
await admin.gates.delete('435282da-4548-4e08-8f9e-a6104803fb8a');
```

**Parameters:**

- `gateId` (string): Gate UUID

**Returns:** `void`

#### `admin.gates.suggestions(gateId)`

Get AI-powered model recommendations for a gate.

```typescript
const suggestions = await admin.gates.suggestions(
  '435282da-4548-4e08-8f9e-a6104803fb8a'
);

console.log(`Primary: ${suggestions.primary}`);
console.log(`Alternatives: ${suggestions.alternatives.join(', ')}`);
console.log(`Reasoning: ${suggestions.reasoning}`);
```

**Parameters:**

- `gateId` (string): Gate UUID

**Returns:** `TaskAnalysis`

### API Keys Management

#### `admin.keys.list()`

List all API keys.

```typescript
const keys = await admin.keys.list();

keys.forEach((key) => {
  console.log(`${key.name}: ${key.keyPrefix}...`);
  console.log(`Created: ${key.createdAt}`);
  console.log(`Last used: ${key.lastUsedAt || 'Never'}`);
});
```

**Returns:** `ApiKey[]`

#### `admin.keys.create(data)`

Create a new API key.

```typescript
const result = await admin.keys.create({ name: 'production-api-key' });

console.log('API Key:', result.key); // Save this - shown only once!
console.log('Key ID:', result.id);
console.log('Prefix:', result.keyPrefix);
```

**Parameters:**

- `name` (string): Key name

**Returns:** `CreateKeyResponse` (includes full `key` - only shown once)

**Important:** Save the returned `key` immediately - it cannot be retrieved again.

#### `admin.keys.delete(keyId)`

Revoke an API key.

```typescript
await admin.keys.delete('key-id-here');
```

**Parameters:**

- `keyId` (string): API key ID

**Returns:** `void`

### Logs & Analytics

#### `admin.logs.list(options?)`

List request logs with optional filtering.

```typescript
// Get recent logs
const logs = await admin.logs.list({
  limit: 100,
  offset: 0,
});

// Filter by gate
const gateLogs = await admin.logs.list({
  gateId: '435282da-4548-4e08-8f9e-a6104803fb8a',
  limit: 50,
});

logs.forEach((log) => {
  console.log(`${log.timestamp}: ${log.model}`);
  console.log(`Tokens: ${log.usage.totalTokens}`);
  console.log(`Cost: $${log.cost}`);
  console.log(`Latency: ${log.latencyMs}ms`);
});
```

**Parameters:**

- `limit` (number, optional): Number of logs to return
- `offset` (number, optional): Pagination offset
- `gateId` (string, optional): Filter by gate ID

**Returns:** `Log[]`

## TypeScript Support

Full TypeScript support with type definitions from `@layer-ai/sdk`:

```typescript
import { LayerAdmin } from '@layer-ai/admin';
import type { Gate, GateConfig, ApiKey, Log } from '@layer-ai/sdk';

const admin = new LayerAdmin({ apiKey: 'key' });

// All methods are fully typed
const gate: Gate = await admin.gates.get('gate-id');
```

## Usage with Inference SDK

The admin package is designed to work alongside the inference SDK:

```typescript
import { Layer } from '@layer-ai/sdk';
import { LayerAdmin } from '@layer-ai/admin';

// Admin operations - setup and management
const admin = new LayerAdmin({ apiKey: process.env.LAYER_ADMIN_KEY });

const gate = await admin.gates.create({
  name: 'production-gate',
  model: 'gpt-4o',
  temperature: 0.7,
});

// Inference operations - actual LLM calls
const layer = new Layer({ apiKey: process.env.LAYER_API_KEY });

const response = await layer.complete({
  gate: gate.id, // Use the ID from admin operations
  data: {
    messages: [{ role: 'user', content: 'Hello!' }],
  },
});
```

## Examples

### Infrastructure as Code

```typescript
import { LayerAdmin } from '@layer-ai/admin';

const admin = new LayerAdmin({ apiKey: process.env.LAYER_ADMIN_KEY });

// Set up production gates
const productionGate = await admin.gates.create({
  name: 'prod-chatbot',
  model: 'gpt-4o',
  temperature: 0.7,
  routingStrategy: 'fallback',
  fallbackModels: ['claude-sonnet-4', 'gemini-2.0-flash-exp'],
});

const devGate = await admin.gates.create({
  name: 'dev-chatbot',
  model: 'gpt-4o-mini',
  temperature: 0.5,
});

console.log('Production Gate ID:', productionGate.id);
console.log('Development Gate ID:', devGate.id);
```

### Dynamic Gate Configuration

```typescript
// Update gate based on analytics
const logs = await admin.logs.list({
  gateId: 'gate-id',
  limit: 1000,
});

const avgLatency =
  logs.reduce((sum, log) => sum + log.latencyMs, 0) / logs.length;

if (avgLatency > 2000) {
  // Switch to faster model
  await admin.gates.update('gate-id', {
    model: 'gpt-4o-mini',
    fallbackModels: ['gemini-2.0-flash-exp'],
  });
}
```

### Automated API Key Rotation

```typescript
// Create new API key
const newKey = await admin.keys.create({ name: 'app-key-2026-01' });

// Save new key to secure storage
await saveToVault(newKey.key);

// Delete old key after grace period
setTimeout(
  async () => {
    await admin.keys.delete('old-key-id');
  },
  7 * 24 * 60 * 60 * 1000
); // 7 days
```

### Cost Monitoring

```typescript
// Get usage for billing period
const logs = await admin.logs.list({ limit: 10000 });

const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
const totalTokens = logs.reduce((sum, log) => sum + log.usage.totalTokens, 0);

console.log(`Total cost: $${totalCost.toFixed(2)}`);
console.log(`Total tokens: ${totalTokens.toLocaleString()}`);

// Group by gate
const costByGate = logs.reduce(
  (acc, log) => {
    acc[log.gateId] = (acc[log.gateId] || 0) + log.cost;
    return acc;
  },
  {} as Record<string, number>
);

console.log('Cost by gate:', costByGate);
```

## Error Handling

```typescript
try {
  const gate = await admin.gates.create({
    name: 'my-gate',
    model: 'gpt-4o',
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to create gate:', error.message);
    // Handle: authentication errors, validation errors, etc.
  }
}
```

## Important Notes

### Gate IDs vs Names

- **Names** are only used when **creating** a gate
- **IDs** (UUIDs) are required for all other operations
- The gate ID is returned in the response from `gates.create()`
- Find gate IDs in your dashboard at `https://uselayer.ai/dashboard/gates`

```typescript
// ✅ Correct: Use name for creation
const gate = await admin.gates.create({ name: 'my-gate', model: 'gpt-4o' });

// ✅ Correct: Use ID for everything else
await admin.gates.update(gate.id, { temperature: 0.8 });
await admin.gates.delete(gate.id);

// ❌ Wrong: Cannot use name for update/delete
await admin.gates.update('my-gate', { temperature: 0.8 }); // Error!
```

### API Key Security

- Use separate API keys for admin operations vs inference
- Store admin keys securely (environment variables, secrets managers)
- Rotate keys regularly
- Delete unused keys promptly

## Related Packages

- [`@layer-ai/sdk`](../sdk) - Inference SDK for LLM completions
- [`@layer-ai/core`](../core) - Core API implementation (for self-hosting)

## License

MIT
