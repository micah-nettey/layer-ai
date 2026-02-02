# @layer-ai/sdk

TypeScript/JavaScript SDK for Layer AI - Intelligent LLM inference with smart routing and fallbacks.

> **v1.0.0**: This package is now **inference-only**. For admin operations (managing gates, keys, logs), use [`@layer-ai/admin`](../admin).

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
  apiKey: process.env.LAYER_API_KEY
});

// Make an inference request through a gate
const response = await layer.complete({
  gate: '435282da-4548-4e08-8f9e-a6104803fb8a',  // Gate ID (UUID)
  data: {
    messages: [
      { role: 'user', content: 'Explain quantum computing in simple terms' }
    ]
  }
});

console.log(response.content);
```

## Migrating from v0.x?

See the [Migration Guide](../../MIGRATION_V1.md) for detailed upgrade instructions.

**Key Changes:**
- SDK is now inference-only - use `@layer-ai/admin` for management operations
- Gate IDs (UUIDs) required instead of gate names
- Request format changed to include `data` wrapper

## Configuration

### Constructor Options

```typescript
const layer = new Layer({
  apiKey: string;        // Required: Your Layer API key
  baseUrl?: string;      // Optional: API base URL (default: https://api.uselayer.ai)
});
```

## API Reference

### Type-Safe Methods (v2.5.0+)

Layer SDK now provides dedicated type-safe methods for each modality with full TypeScript support and IDE autocomplete.

#### `layer.chat(request)`

Type-safe chat completions with message-based interface.

**Parameters:**

```typescript
{
  gateId: string;        // Required: Gate ID (UUID)
  data: {
    messages: Message[]; // Required: Conversation messages
    temperature?: number;  // Optional: Override gate temperature
    maxTokens?: number;    // Optional: Override max tokens
    topP?: number;         // Optional: Override top-p sampling
  };
  model?: string;        // Optional: Override gate model
  metadata?: Record<string, unknown>; // Optional: Custom metadata
}
```

**Example:**

```typescript
const response = await layer.chat({
  gateId: 'my-chat-gate-id',
  data: {
    messages: [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Explain quantum computing' }
    ],
    temperature: 0.7
  }
});
```

#### `layer.image(request)`

Type-safe image generation.

**Parameters:**

```typescript
{
  gateId: string;        // Required: Gate ID (UUID)
  data: {
    prompt: string;      // Required: Image generation prompt
    size?: string;       // Optional: Image size (e.g., '1024x1024')
    quality?: string;    // Optional: Image quality
    style?: string;      // Optional: Image style
  };
  model?: string;
  metadata?: Record<string, unknown>;
}
```

**Example:**

```typescript
const response = await layer.image({
  gateId: 'my-image-gate-id',
  data: {
    prompt: 'A serene landscape with mountains and a lake',
    size: '1024x1024',
    quality: 'hd'
  }
});

console.log(response.imageUrl); // Generated image URL
```

#### `layer.video(request)`

Type-safe video generation.

**Parameters:**

```typescript
{
  gateId: string;        // Required: Gate ID (UUID)
  data: {
    prompt: string;      // Required: Video generation prompt
  };
  model?: string;
  metadata?: Record<string, unknown>;
}
```

#### `layer.embeddings(request)`

Type-safe text embeddings.

**Parameters:**

```typescript
{
  gateId: string;        // Required: Gate ID (UUID)
  data: {
    input: string | string[]; // Required: Text(s) to embed
  };
  model?: string;
  metadata?: Record<string, unknown>;
}
```

**Example:**

```typescript
const response = await layer.embeddings({
  gateId: 'my-embeddings-gate-id',
  data: {
    input: 'Machine learning is fascinating'
  }
});

console.log(response.embeddings[0].length); // Vector dimensions (e.g., 1536)
```

#### `layer.tts(request)`

Type-safe text-to-speech.

**Parameters:**

```typescript
{
  gateId: string;        // Required: Gate ID (UUID)
  data: {
    input: string;       // Required: Text to synthesize
    voice?: string;      // Optional: Voice selection
  };
  model?: string;
  metadata?: Record<string, unknown>;
}
```

**Example:**

```typescript
const response = await layer.tts({
  gateId: 'my-tts-gate-id',
  data: {
    input: 'Hello, this is a test of text to speech',
    voice: 'alloy'
  }
});

console.log(response.audio.base64); // Base64 encoded audio
console.log(response.audio.format); // Audio format (e.g., 'mp3')
```

#### `layer.ocr(request)`

Type-safe optical character recognition and document processing.

**Parameters:**

```typescript
{
  gateId: string;        // Required: Gate ID (UUID)
  data: {
    documentUrl?: string;  // Document URL
    imageUrl?: string;     // Image URL
    base64?: string;       // Base64 encoded document/image
    // Note: Provide one of the above
  };
  model?: string;
  metadata?: Record<string, unknown>;
}
```

## Advanced Usage Patterns

### Streaming Completions
For real-time user interfaces, use the `stream: true` option to receive text chunks as they are generated.

```typescript
import { Layer } from '@layer-ai/sdk';
import type { ChatResponseChunk } from '@layer-ai/sdk';

const layer = new Layer({ apiKey: process.env.LAYER_API_KEY });

const stream = await layer.chat({
  gateId: 'your-gate-uuid',
  data: {
    messages: [{ role: 'user', content: 'Explain the theory of relativity' }],
    stream: true
  }
});

// Type-safe iteration over the stream
for await (const chunk: ChatResponseChunk of stream) {
  process.stdout.write(chunk.content);
}
```
### Professional Error Handling

The SDK provides a `LayerError` class to help you distinguish between API errors, authentication issues, and network failures.

```typescript
import { Layer, LayerError } from '@layer-ai/sdk';

try {
  const response = await layer.chat({
    gateId: 'my-gate-id',
    data: { messages: [{ role: 'user', content: 'Hello' }] }
  });
} catch (error) {
  if (error instanceof LayerError) {
    // Handle SDK-specific errors (Rate limits, Invalid API Key, etc.)
    console.error(`Layer Error [${error.code}]: ${error.message}`);
  } else {
    // Handle generic runtime or connection errors
    console.error('Unexpected error:', error);
  }
}
```
### Provide Comparison & Model Overrrides

You can use a single Gate to compare performance across different providers by overriding the model parameter.

```typescript
const providers = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'];

for (const model of providers) {
  console.log(`Testing with ${model}...`);
  
  const response = await layer.chat({
    gateId: 'universal-gate-id',
    model: model, // Overriding the gate's default model
    data: {
      messages: [{ role: 'user', content: 'What is the best way to bake sourdough?' }]
    }
  });

  console.log(`${model} response:`, response.content);
}
```

## Configuration Reference

### SDK Constructor Options
When initializing the `Layer` client, you can pass the following configuration:

| Option | Type | Required | Description | Default |
| :--- | :--- | :--- | :--- | :--- |
| `apiKey` | `string` | **Yes** | Your Layer API Key. | - |
| `baseUrl` | `string` | No | Override the API endpoint for self-hosting. | `https://api.uselayer.ai` |
| `timeout` | `number` | No | Request timeout in milliseconds. | `30000` |
| `maxRetries` | `number` | No | Number of automatic retries on 5xx errors. | `2` |

### Chat Request Data Options
The `data` object within `layer.chat()` supports these parameters:

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `messages` | `Message[]` | Array of roles ('system', 'user', 'assistant') and content. |
| `temperature` | `number` | Sampling temperature (0.0 to 2.0). |
| `maxTokens` | `number` | The maximum number of tokens to generate. |
| `stream` | `boolean` | Whether to stream the response as chunks. |

---

## Best Practices

### Secure Your API Keys
Never commit your `LAYER_API_KEY` to version control. Always use environment variables.

```typescript
// .env file
// LAYER_API_KEY=your_secret_key

// Use process.env in your code
const layer = new Layer({
  apiKey: process.env.LAYER_API_KEY!
});
```
### Use Specific Gate IDs
While the SDK supports legacy routing, using the **Gate UUID** ensures your requests are routed through the exact configuration you defined in the dashboard.

### Implement Global Catch-Alls
In addition to specific `LayerError` handling, ensure your application has a global error handler to prevent crashes during network outages.

### Leverage Smart Routing for Cost Control
Instead of hardcoding expensive models like `gpt-4o`, configure a **Gate** with smart routing strategies to automatically use cheaper models for simple tasks.

### `layer.complete(request)` (v2 Legacy)

Send a generic completion request through a gate. This method remains available for backwards compatibility.

**Parameters:**

```typescript
{
  gate: string;          // Required: Gate ID (UUID)
  data: {
    messages: Message[]; // Required: Conversation messages
    temperature?: number;  // Optional: Override gate temperature
    maxTokens?: number;    // Optional: Override max tokens
    topP?: number;         // Optional: Override top-p sampling
  };
  model?: string;        // Optional: Override gate model
  type?: 'chat';        // Optional: Request type (default: 'chat')
}
```

**Response:**

```typescript
{
  content: string;       // Generated text
  model: string;         // Model used (may differ from requested if fallback occurred)
  finishReason: string;  // Why generation stopped
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;          // Cost in USD
  latencyMs: number;     // Request latency
}
```

**Example:**

```typescript
const response = await layer.complete({
  gate: '435282da-4548-4e08-8f9e-a6104803fb8a',
  data: {
    messages: [
      { role: 'system', content: 'You are a helpful coding assistant' },
      { role: 'user', content: 'Write a hello world function in Python' }
    ],
    temperature: 0.7,
    maxTokens: 500
  }
});

console.log(response.content);
console.log(`Cost: $${response.cost.toFixed(6)}`);
console.log(`Tokens: ${response.usage.totalTokens}`);
```

### `layer.models`

Access to the model registry utilities.

```typescript
// Get all available models
const models = layer.models.getAll();

// Get models by provider
const openaiModels = layer.models.getByProvider('openai');

// Get model metadata
const model = layer.models.get('gpt-4o');
```

## Smart Routing & Fallbacks

Layer AI automatically handles model fallbacks when configured:

```typescript
// If your gate has fallback models configured:
// Primary: gpt-4o
// Fallbacks: [claude-sonnet-4, gemini-2.0-flash-exp]

const response = await layer.complete({
  gate: 'my-gate-id',
  data: { messages: [...] }
});

// If gpt-4o fails, automatically tries claude-sonnet-4
// If that fails, tries gemini-2.0-flash-exp
// Returns the first successful response
```

## Parameter Overrides

Gates can allow or restrict parameter overrides:

```typescript
// If gate allows temperature overrides
const response = await layer.complete({
  gate: 'my-gate-id',
  data: {
    messages: [...],
    temperature: 0.9  // Override gate's default
  }
});

// If override not allowed, gate's default is used
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  Gate,
  GateConfig,
  Log,
  ApiKey,
  SupportedModel,
  LayerRequest,
  LayerResponse
} from '@layer-ai/sdk';
```

## Error Handling

```typescript
try {
  const response = await layer.complete({
    gate: 'my-gate-id',
    data: { messages: [...] }
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('Layer error:', error.message);
    // Handle: authentication, rate limits, model failures, etc.
  }
}
```

## Examples

### Basic Chatbot

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({ apiKey: process.env.LAYER_API_KEY });

async function chat(userMessage: string) {
  const response = await layer.complete({
    gate: process.env.CHATBOT_GATE_ID!,
    data: {
      messages: [
        { role: 'user', content: userMessage }
      ]
    }
  });

  return response.content;
}

const answer = await chat('What is the capital of France?');
console.log(answer);
```

### Multi-turn Conversation

```typescript
const messages = [
  { role: 'user', content: 'Hello!' },
  { role: 'assistant', content: 'Hi! How can I help you today?' },
  { role: 'user', content: 'Tell me about quantum computing' }
];

const response = await layer.complete({
  gate: 'chat-gate-id',
  data: { messages }
});

messages.push({
  role: 'assistant',
  content: response.content
});
```

### With Model Override

```typescript
const response = await layer.complete({
  gate: 'my-gate-id',
  model: 'claude-sonnet-4',  // Override gate's default model
  data: {
    messages: [
      { role: 'user', content: 'Explain relativity' }
    ]
  }
});
```

## Admin Operations

For managing gates, API keys, and logs, use the separate admin package:

```bash
npm install @layer-ai/admin
```

```typescript
import { LayerAdmin } from '@layer-ai/admin';

const admin = new LayerAdmin({ apiKey: process.env.LAYER_ADMIN_KEY });

// Create a gate
const gate = await admin.gates.create({
  name: 'my-gate',
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a helpful assistant'
});

// Use the gate ID for completions
const response = await layer.complete({
  gate: gate.id,
  data: { messages: [...] }
});
```

See the [`@layer-ai/admin` documentation](../admin) for details.

## Database Migrations

If you're self-hosting Layer AI, the SDK includes database migrations:

```bash
# Run migrations
cd node_modules/@layer-ai/core
npm run migrate
```

Migrations are located in `@layer-ai/core/dist/lib/db/migrations/`

## Related Packages

- [`@layer-ai/admin`](../admin) - Admin SDK for managing gates, keys, and logs
- [`@layer-ai/core`](../core) - Core API implementation (for self-hosting)

## License

MIT
