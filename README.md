# Layer AI

**Open-source AI gateway for managing LLM requests with intelligent routing and fallbacks.**

Layer sits between your application and AI providers (OpenAI, Anthropic, Google), giving you a unified API to manage models, track costs, and implement routing strategies—all from a single interface.

## Features

- **Unified API** - One interface for OpenAI, Anthropic, and Google models
- **Smart Routing** - AI-powered model recommendations based on your task description
- **Fallback Support** - Automatic failover when primary models are unavailable
- **Load Balancing** - Distribute requests across multiple models with round-robin
- **Request Logging** - Track all requests, costs, and performance metrics
- **Configuration Management** - Define gates (model configs) via YAML or SDK
- **CLI Tool** - Manage everything from the command line
- **TypeScript SDK** - Type-safe client library for Node.js applications
- **Self-Hostable** - Run on your own infrastructure

## Quick Start

### Installation

```bash
npm install @layer-ai/sdk @layer-ai/cli
```

### Basic Usage

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({
  apiKey: process.env.LAYER_API_KEY,
  baseUrl: 'http://localhost:3001',
});

// Complete a request through a gate
const response = await layer.complete({
  gate: 'my-gate',
  prompt: 'What is the capital of France?',
});

console.log(response.text);
```

### Smart Routing

Get AI-powered model recommendations for your gates:

```typescript
// Get model suggestions based on task description
const suggestions = await layer.gates.suggestions('my-gate');

console.log(suggestions.primary); // Best model for this task
console.log(suggestions.alternatives); // Other good options
console.log(suggestions.reasoning); // Why these models were chosen
```

Smart routing analyzes your gate's task description and user preferences (cost, latency, quality weights) to recommend the best models from the registry.

### CLI Usage

```bash
# Initialize a new config file
npx layer init

# Login to your Layer instance
npx layer login

# Create a gate
npx layer gates create

# Sync gates to/from config file
npx layer pull
npx layer push
```

## Architecture

Layer consists of three main components:

- **API Server** (`packages/api`) - REST API for managing gates, keys, and completions
- **SDK** (`packages/sdk`) - TypeScript client library
- **CLI** (`packages/cli`) - Command-line interface for management

## Configuration

Define your gates in `layer.config.yaml`:

```yaml
gates:
  - name: default
    model: gpt-4o
    description: Default gate for general queries
    temperature: 0.7
    maxTokens: 1000
    routingStrategy: fallback
    fallbackModels:
      - claude-sonnet-4
      - gemini-2.0-flash-exp
```

## Routing Strategies

- **Single** - Use one model
- **Fallback** - Try backup models if primary fails
- **Round-robin** - Distribute requests across multiple models

## Examples

Check out the [layer-ai-examples](https://github.com/micah-nettey/layer-ai-examples) repository for complete example projects:

- **Content Generator** - Next.js app demonstrating smart routing for blog outlines, social captions, and product descriptions
- **Chatbot Example** - Next.js app demonstrating normalization for a chatbot that can share context across multiple models from different providers.

## Documentation

- [Configuration Guide](CONFIG.md) - Gate configuration and best practices
- [SDK Documentation](packages/sdk/README.md) - TypeScript SDK reference
- [CLI Documentation](packages/cli/README.md) - CLI commands and workflows
- [Development Guide](DEVELOPMENT.md) - Local development setup
- [Contributing Guide](CONTRIBUTING.md) - How to contribute

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run API server
pnpm --filter @layer-ai/api dev

# Run tests
pnpm test
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.
