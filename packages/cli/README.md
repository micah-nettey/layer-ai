# @layer-ai/cli

Command-line interface for managing Layer AI gates, API keys, and configuration.

## Installation

```bash
npm install -g @layer-ai/cli
# or use with npx
npx @layer-ai/cli
```

## Quick Start

```bash
# Initialize a new config file
layer init

# Login to your Layer instance
layer login

# Create a gate interactively
layer gates create

# Sync your config file to remote
layer push
```

## Authentication

### Login

Authenticate with your Layer instance:

```bash
layer login
```

You'll be prompted for:
- API URL (e.g., `http://localhost:3001`)
- API Key

Credentials are stored locally in `~/.layer/credentials.json`.

## Commands

### Initialization

#### `layer init`

Create a new `layer.config.yaml` file with example gates.

```bash
layer init
layer init --file custom-config.yaml
```

#### `layer validate`

Validate your config file without applying changes.

```bash
layer validate
layer validate --file custom-config.yaml
```

### Gates

#### `layer gates list`

List all gates.

```bash
layer gates list
```

#### `layer gates get <name>`

Get details for a specific gate.

```bash
layer gates get my-gate
```

#### `layer gates create`

Create a new gate interactively.

```bash
layer gates create
```

You'll be prompted for:
- Gate name
- Model (gpt-4o, claude-sonnet-4, gemini-2.0-flash-exp, etc.)
- Description
- System prompt
- Temperature (0-2)
- Max tokens
- Top P (0-1)
- Allow overrides (yes/no)
- Routing strategy (single, fallback, round-robin)
- Fallback models (if applicable)
- Tags

After creation, you can optionally pull the gate to your config file.

#### `layer gates update <name>`

Update an existing gate interactively.

```bash
layer gates update my-gate
```

After updating, you can optionally pull changes to your config file.

#### `layer gates delete <name>`

Delete a gate.

```bash
layer gates delete my-gate
```

#### `layer gates suggestions <name>`

Get AI-powered model recommendations for a gate (internal feature).

```bash
layer gates suggestions my-gate
```

### API Keys

#### `layer keys list`

List all API keys.

```bash
layer keys list
```

#### `layer keys create`

Create a new API key.

```bash
layer keys create
```

You'll be prompted for a key name. The key will be displayed once - save it securely.

#### `layer keys revoke <id>`

Revoke an API key.

```bash
layer keys revoke key-abc123
```

### Sync

#### `layer pull`

Pull gates from remote to your local config file.

```bash
layer pull
layer pull --file custom-config.yaml
layer pull --force  # Skip confirmation
```

This command:
1. Fetches all gates from remote
2. Compares with your local config
3. Shows what will be added/updated/deleted
4. Prompts for confirmation
5. Updates your config file

#### `layer push`

Push gates from your local config file to remote.

```bash
layer push
layer push --file custom-config.yaml
layer push --force  # Skip confirmation
```

This command:
1. Reads your local config file
2. Compares with remote gates
3. Shows what will be created/updated/deleted
4. Prompts for confirmation
5. Applies changes to remote

## Configuration File

Layer uses a YAML configuration file (`layer.config.yaml`) to define gates.

For complete configuration documentation including field reference, routing strategies, best practices, and examples, see the [Configuration Guide](../../CONFIG.md).

## Workflow

### Typical Development Workflow

```bash
# 1. Initialize a new project
layer init

# 2. Login to your Layer instance
layer login

# 3. Edit layer.config.yaml with your gates
vim layer.config.yaml

# 4. Push gates to remote
layer push

# 5. Make changes on remote (via dashboard or CLI)
layer gates update my-gate

# 6. Pull changes back to local
layer pull
```

### CI/CD Integration

```bash
# In your deployment script
export LAYER_API_KEY=$PRODUCTION_API_KEY
layer push --file layer.config.yaml --force
```

## Global Options

All commands support:

- `--help` - Show help for the command
- `--version` - Show CLI version

## Examples

### Create a production gate with fallback

```bash
layer gates create
# Name: production-gate
# Model: gpt-4o
# Routing strategy: fallback
# Fallback models: claude-sonnet-4, gemini-2.0-flash-exp
```

### Sync config across environments

```bash
# Development
layer pull --file dev.layer.yaml

# Staging
layer pull --file staging.layer.yaml

# Production
layer pull --file production.layer.yaml
```

### Manage API keys

```bash
# Create a key for your application
layer keys create
# Name: my-app-production
# [Save the generated key securely]

# List keys
layer keys list

# Revoke a compromised key
layer keys revoke key-abc123
```

## Troubleshooting

### Authentication Errors

If you get authentication errors, try logging in again:

```bash
layer login
```

### Config File Errors

Validate your config file:

```bash
layer validate
```

### Sync Conflicts

If you have conflicts between local and remote:

```bash
# Pull changes from remote (remote wins)
layer pull --force

# Push local changes to remote (local wins)
layer push --force
```

## License

MIT
