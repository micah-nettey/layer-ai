# @layer-ai/sdk

TypeScript/JavaScript SDK for Layer AI - Manage LLM requests with intelligent routing and fallbacks.

## Installation

```bash
npm install @layer-ai/sdk
# or
pnpm add @layer-ai/sdk
# or
yarn add @layer-ai/sdk
```

## Quick Start

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({
  apiKey: process.env.LAYER_API_KEY,
  baseUrl: 'http://localhost:3001'
});

// Complete a request through a gate
const response = await layer.complete({
  gate: 'my-gate',
  prompt: 'Explain quantum computing in simple terms'
});

console.log(response.text);
```

## Configuration

### Constructor Options

```typescript
const layer = new Layer({
  apiKey: string;        // Required: Your Layer API key
  baseUrl?: string;      // Optional: API base URL (default: http://localhost:3001)
  adminMode?: boolean;   // Optional: Enable mutation operations (default: false)
});
```

### Admin Mode

By default, the SDK is read-only to prevent accidental mutations in production. To enable create/update/delete operations, set `adminMode: true`:

```typescript
const layer = new Layer({
  apiKey: process.env.LAYER_API_KEY,
  adminMode: true  // Required for mutations
});

// Now you can create/update/delete gates and keys
await layer.gates.create({
  name: 'my-gate',
  model: 'gpt-4o',
  temperature: 0.7
});
```

**Note:** Admin mode is intended for setup scripts and infrastructure-as-code. For ongoing management, use the CLI or config files.

## API Reference

### Completions

#### `layer.complete(params)`

Send a completion request through a gate.

```typescript
const response = await layer.complete({
  gate: 'my-gate',
  prompt: 'What is the capital of France?',

  // Optional overrides (if gate allows)
  model?: 'gpt-4o',
  temperature?: 0.8,
  maxTokens?: 500,
  topP?: 0.9
});

// Response shape
{
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
}
```

### Gates

#### `layer.gates.list()`

List all gates.

```typescript
const gates = await layer.gates.list();
// Returns: Gate[]
```

#### `layer.gates.get(name)`

Get a specific gate by name.

```typescript
const gate = await layer.gates.get('my-gate');
```

#### `layer.gates.create(data)` ⚠️ Requires Admin Mode

Create a new gate. For detailed information about gate configuration fields, see the [Configuration Guide](../../CONFIG.md).

```typescript
await layer.gates.create({
  name: 'my-gate',
  model: 'gpt-4o',
  description: 'My custom gate',
  systemPrompt: 'You are a helpful assistant',
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1.0,
  allowOverrides: true,  // or specific fields: ['temperature', 'maxTokens']
  routingStrategy: 'fallback',
  fallbackModels: ['claude-sonnet-4', 'gemini-2.0-flash-exp'],
  tags: ['production', 'general']
});
```

#### `layer.gates.update(name, data)` ⚠️ Requires Admin Mode

Update an existing gate.

```typescript
await layer.gates.update('my-gate', {
  temperature: 0.8,
  maxTokens: 1500
});
```

#### `layer.gates.delete(name)` ⚠️ Requires Admin Mode

Delete a gate.

```typescript
await layer.gates.delete('my-gate');
```

### API Keys

#### `layer.keys.list()`

List all API keys.

```typescript
const keys = await layer.keys.list();
```

#### `layer.keys.create(name)` ⚠️ Requires Admin Mode

Create a new API key.

```typescript
const key = await layer.keys.create('my-app-key');
// Returns: { id: string, name: string, key: string, createdAt: string }
// Save the key - it's only shown once!
```

#### `layer.keys.delete(id)` ⚠️ Requires Admin Mode

Revoke an API key.

```typescript
await layer.keys.delete('key-id');
```

### Logs

#### `layer.logs.list(options?)`

List request logs.

```typescript
const logs = await layer.logs.list({
  limit: 100,
  offset: 0,
  gateName: 'my-gate'  // Optional filter
});
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import { Layer, Gate, CompletionRequest, CompletionResponse } from '@layer-ai/sdk';

const layer = new Layer({ apiKey: 'key' });

// All methods are fully typed
const response: CompletionResponse = await layer.complete({
  gate: 'my-gate',
  prompt: 'Hello'
});
```

## Error Handling

```typescript
try {
  const response = await layer.complete({
    gate: 'my-gate',
    prompt: 'Hello'
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('Layer error:', error.message);
  }
}
```

## Examples

### Basic Completion

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({
  apiKey: process.env.LAYER_API_KEY
});

const response = await layer.complete({
  gate: 'default',
  prompt: 'Explain machine learning'
});

console.log(response.text);
```

### With Parameter Overrides

```typescript
const response = await layer.complete({
  gate: 'my-gate',
  prompt: 'Write a haiku about coding',
  temperature: 0.9,  // More creative
  maxTokens: 100
});
```

### Infrastructure as Code

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({
  apiKey: process.env.LAYER_API_KEY,
  adminMode: true
});

// Create gates programmatically
await layer.gates.create({
  name: 'production-gate',
  model: 'gpt-4o',
  temperature: 0.7,
  routingStrategy: 'fallback',
  fallbackModels: ['claude-sonnet-4']
});

await layer.gates.create({
  name: 'dev-gate',
  model: 'gpt-4o-mini',
  temperature: 0.5
});
```

## License

MIT
