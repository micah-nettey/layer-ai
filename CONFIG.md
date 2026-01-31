# Configuration Guide

Layer uses a YAML configuration file to define gates (model configurations). This guide explains the configuration format and options.

## Configuration File

By default, Layer looks for `layer.config.yaml` in your project root.

### Basic Example

```yaml
gates:
  - name: default
    model: gpt-4o
    description: Default gate for general queries
    temperature: 0.7
    maxTokens: 1000
```

### Complete Example

```yaml
gates:
  - name: production-gate
    model: gpt-4o
    description: Production gate with fallback
    systemPrompt: You are a helpful assistant
    temperature: 0.7
    maxTokens: 1000
    topP: 1.0
    allowOverrides: true
    routingStrategy: fallback
    fallbackModels:
      - claude-sonnet-4
      - gemini-2.0-flash-exp
    tags:
      - production
      - general

  - name: code-assistant
    model: claude-sonnet-4
    description: Specialized for code generation
    systemPrompt: You are an expert programmer
    temperature: 0.5
    maxTokens: 2000
    allowOverrides:
      - temperature
      - maxTokens
    routingStrategy: single
    tags:
      - coding
      - development
```

## Field Reference

### Required Fields

| Field   | Type   | Description                                                                      |
| ------- | ------ | -------------------------------------------------------------------------------- |
| `name`  | string | Unique identifier for the gate                                                   |
| `model` | string | Primary model to use (e.g., `gpt-4o`, `claude-sonnet-4`, `gemini-2.0-flash-exp`) |

### Optional Fields

| Field             | Type             | Default  | Description                                              |
| ----------------- | ---------------- | -------- | -------------------------------------------------------- |
| `description`     | string           | -        | Human-readable description of the gate's purpose         |
| `systemPrompt`    | string           | -        | System message sent to the model                         |
| `temperature`     | number           | 0.7      | Sampling temperature (0-2). Higher = more random         |
| `maxTokens`       | number           | 1000     | Maximum tokens to generate                               |
| `topP`            | number           | 1.0      | Nucleus sampling threshold (0-1)                         |
| `allowOverrides`  | boolean or array | false    | Allow runtime parameter overrides (see below)            |
| `routingStrategy` | string           | `single` | Routing strategy: `single`, `fallback`, or `round-robin` |
| `fallbackModels`  | string[]         | -        | Backup models for fallback routing                       |
| `tags`            | string[]         | -        | Tags for organization and filtering                      |

## Configuration Options

### Allow Overrides

Control which parameters can be overridden at request time:

```yaml
# Allow all overrides
allowOverrides: true

# Allow specific overrides
allowOverrides:
  - temperature
  - maxTokens

# Disallow all overrides (default)
allowOverrides: false
```

### Routing Strategies

#### Single (Default)

Use only the primary model:

```yaml
name: simple-gate
model: gpt-4o
routingStrategy: single
```

#### Fallback

Try backup models if primary fails:

```yaml
name: reliable-gate
model: gpt-4o
routingStrategy: fallback
fallbackModels:
  - claude-sonnet-4
  - gemini-2.0-flash-exp
```

**How it works:**

1. Try primary model (`gpt-4o`)
2. If it fails, try first fallback (`claude-sonnet-4`)
3. If that fails, try next fallback (`gemini-2.0-flash-exp`)
4. Return error if all models fail

#### Round-Robin

Distribute requests evenly across multiple models:

```yaml
name: load-balanced-gate
model: gpt-4o
routingStrategy: round-robin
fallbackModels:
  - claude-sonnet-4
  - gemini-2.0-flash-exp
```

**How it works:**

- Request 1 → `gpt-4o`
- Request 2 → `claude-sonnet-4`
- Request 3 → `gemini-2.0-flash-exp`
- Request 4 → `gpt-4o` (cycles back)

### Supported Models

Layer supports models from multiple providers:

**OpenAI:**

- `gpt-4o`
- `gpt-4o-mini`
- `gpt-4-turbo`
- `gpt-3.5-turbo`

**Anthropic:**

- `claude-sonnet-4`
- `claude-3-5-sonnet-20241022`
- `claude-3-opus-20240229`
- `claude-3-haiku-20240307`

**Google:**

- `gemini-2.0-flash-exp`
- `gemini-1.5-pro`
- `gemini-1.5-flash`

## Using Configuration

### With CLI

```bash
# Initialize a new config file
layer init

# Validate your config
layer validate

# Push config to remote
layer push

# Pull config from remote
layer pull
```

### With SDK

> **TODO:** We plan to add support for the SDK to directly read the config file before making API calls, enabling fully offline configuration without requiring a deployed Layer instance.

Currently, the SDK uses gates already deployed to your Layer instance:

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({
  apiKey: process.env.LAYER_API_KEY,
});

// Use a gate by name
const response = await layer.complete({
  gate: 'production-gate',
  prompt: 'Hello!',
});
```

### Parameter Overrides

If `allowOverrides` is enabled, you can override parameters at request time:

```typescript
const response = await layer.complete({
  gate: 'production-gate',
  prompt: 'Write a creative story',
  temperature: 0.9, // Override
  maxTokens: 500, // Override
});
```

## Best Practices

### Naming Conventions

Use descriptive, kebab-case names:

```yaml
gates:
  - name: customer-support # Good
  - name: code-review # Good
  - name: gate1 # Bad - not descriptive
```

### Organize with Tags

Use tags to organize gates by environment, purpose, or team:

```yaml
tags:
  - production
  - customer-facing
  - team-backend
```

### Temperature Guidelines

- **0.0-0.3**: Deterministic, factual responses (customer support, data extraction)
- **0.4-0.7**: Balanced creativity (general assistant, Q&A)
- **0.8-1.0**: Creative, varied responses (content generation, brainstorming)
- **1.0+**: Highly creative, experimental (fiction, poetry)

### Set Reasonable Token Limits

```yaml
# Short responses (summaries, classifications)
maxTokens: 500

# Medium responses (explanations, Q&A)
maxTokens: 1000

# Long responses (articles, code generation)
maxTokens: 2000

# Very long responses (documentation, detailed analysis)
maxTokens: 4000
```

### Use Fallbacks for Reliability

For production gates, always configure fallbacks:

```yaml
name: production-gate
model: gpt-4o
routingStrategy: fallback
fallbackModels:
  - claude-sonnet-4 # Different provider
  - gpt-4o-mini # Cheaper alternative
```

## Environment-Specific Configs

Maintain separate configs for different environments:

```bash
# Development
layer.dev.yaml

# Staging
layer.staging.yaml

# Production
layer.prod.yaml
```

Use with CLI:

```bash
layer push --file layer.prod.yaml
layer pull --file layer.dev.yaml
```

## Validation

Layer validates your configuration automatically. Common errors:

**Invalid model name:**

```
Error: Model 'gpt-5' not found
```

**Missing required field:**

```
Error: Gate 'my-gate' is missing required field: model
```

**Invalid temperature:**

```
Error: Temperature must be between 0 and 2
```

Validate before pushing:

```bash
layer validate
```

## Migration

### From Environment Variables

Before (environment variables):

```bash
OPENAI_MODEL=gpt-4o
OPENAI_TEMPERATURE=0.7
```

After (Layer config):

```yaml
gates:
  - name: default
    model: gpt-4o
    temperature: 0.7
```

### From Direct API Calls

Before (direct OpenAI call):

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
  temperature: 0.7,
});
```

After (Layer):

```typescript
const response = await layer.complete({
  gate: 'default',
  prompt: 'Hello',
});
```

## See Also

- [CLI Documentation](packages/cli/README.md) - CLI commands and workflows
- [SDK Documentation](packages/sdk/README.md) - SDK usage and API reference
- [DEVELOPMENT.md](DEVELOPMENT.md) - Local development setup
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
