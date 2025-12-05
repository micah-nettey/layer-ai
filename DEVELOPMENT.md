# Local Development Setup

This guide will help you get Layer AI running locally for development.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+**
- **pnpm 8+**
- **PostgreSQL 14+**

## Quick Start

```bash
# Clone the repository
git clone https://github.com/micah-nettey/layer-ai.git
cd layer-ai

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Database Setup

Layer AI uses PostgreSQL for the API server.

### Install PostgreSQL

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### Create the Database

```bash
# Create the database
createdb layer_db

# Run migrations
cd apps/api
pnpm db:migrate
```

## Environment Variables

Create a `.env` file in the `apps/api` directory:

```bash
cd apps/api
cp .env.example .env
```

### Required Environment Variables

Edit `apps/api/.env` with the following:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/layer_db

# API Configuration
PORT=3001
NODE_ENV=development

# JWT Secret (generate a random string)
JWT_SECRET=your-secret-key-here
```

**Generate a JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Optional: Provider API Keys

If you want to test actual API calls to AI providers, add their API keys:

```env
# Provider API Keys (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

**Note:** These are only needed if you want to make real API calls. For basic development and testing the routing layer, you can omit them.

## Running the API Server

```bash
# From the root directory
pnpm --filter @layer-ai/api dev

# The API will be available at http://localhost:3001
```

You should see output like:
```
✓ Database connected
✓ Migrations up to date
→ API server listening on http://localhost:3001
```

## Creating a Test Account

Once the API is running, create a test account and get an API key.

### Option 1: Using curl

```bash
# Register a new account
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "yourpassword"
  }'

# Login to get your API key
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "yourpassword"
  }'
```

Save the API key from the response - you'll need it for testing.

### Option 2: Using the CLI

```bash
# If you have the CLI built and linked
layer init
```

Follow the prompts to create an account.

## Testing Your Setup

### Make Your First API Call

**Using curl:**

```bash
curl -X POST http://localhost:3001/api/v1/completions \
  -H "Authorization: Bearer your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

**Using the SDK:**

Create a test file `test.ts`:

```typescript
import { Layer } from '@layer-ai/sdk';

const layer = new Layer({
  apiKey: 'your-api-key-here',
  baseURL: 'http://localhost:3001'
});

async function test() {
  const response = await layer.complete({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }]
  });

  console.log(response.content);
}

test();
```

Run it:
```bash
npx tsx test.ts
```

**Using the CLI:**

```bash
# Configure CLI to use local API
export LAYER_API_URL=http://localhost:3001
export LAYER_API_KEY=your-api-key-here

# Test a completion
layer complete "Hello, world!"
```

## Development Workflow

### Working on the SDK

```bash
# Watch mode for development
pnpm --filter @layer-ai/sdk dev

# Build
pnpm --filter @layer-ai/sdk build

# Test locally in another project
cd packages/sdk
pnpm link --global

# In another project
pnpm link --global @layer-ai/sdk
```

### Working on the CLI

```bash
# Build the CLI
pnpm --filter @layer-ai/cli build

# Link globally for testing
cd packages/cli
pnpm link --global

# Now you can use the 'layer' command
layer --help
```

### Working on the API

```bash
# Development mode with hot reload
pnpm --filter @layer-ai/api dev

# Run migrations
pnpm --filter @layer-ai/api db:migrate

# Create a new migration
pnpm --filter @layer-ai/api db:migration:create migration_name
```

## Verification Checklist

Run through this checklist to ensure everything is set up correctly:

- [ ] PostgreSQL is running (`pg_isready`)
- [ ] Database `layer_db` exists
- [ ] Database migrations completed successfully
- [ ] `.env` file configured in `apps/api`
- [ ] API server starts without errors
- [ ] Can create a test account
- [ ] Can retrieve an API key
- [ ] Can make a completion request
- [ ] SDK can connect to local API
- [ ] CLI can connect to local API (if testing CLI)

## Common Issues

### Database Connection Fails

**Problem:** API won't start, shows database connection error

**Solutions:**
- Check PostgreSQL is running: `pg_isready`
- Verify `DATABASE_URL` in `.env`
- Check port 5432 is not in use: `lsof -i :5432`
- Try connecting manually: `psql layer_db`

### API Won't Start

**Problem:** API server fails to start

**Solutions:**
- Check all required env vars are set in `.env`
- Look for port conflicts (default 3001): `lsof -i :3001`
- Check for TypeScript errors: `pnpm build`
- Review logs for specific error messages

### Migrations Fail

**Problem:** Database migrations won't run

**Solutions:**
- Ensure database exists: `psql -l | grep layer_db`
- Check database user has permissions
- Try dropping and recreating: `dropdb layer_db && createdb layer_db`
- Check migration files for syntax errors

### API Key Doesn't Work

**Problem:** API returns 401 Unauthorized

**Solutions:**
- Verify `JWT_SECRET` is set in `.env`
- Check API key format (should start with `sk-`)
- Try creating a new account and API key
- Check Authorization header format: `Bearer <key>`

### Provider API Calls Fail

**Problem:** Requests to OpenAI, Anthropic, etc. fail

**Solutions:**
- Verify provider API keys are set in `.env`
- Check API keys are valid (test directly with provider)
- Review API logs for specific error messages
- Try with a different provider to isolate the issue

## Database Management

### Reset Database

```bash
# Drop and recreate
dropdb layer_db
createdb layer_db
cd apps/api
pnpm db:migrate
```

### View Database

```bash
# Connect to database
psql layer_db

# List tables
\dt

# View schema
\d table_name

# Exit
\q
```

### Seed Test Data

```bash
# If seed script exists
pnpm --filter @layer-ai/api db:seed
```

## Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @layer-ai/sdk test
pnpm --filter @layer-ai/cli test
pnpm --filter @layer-ai/api test

# Watch mode
pnpm --filter @layer-ai/sdk test:watch
```

### Manual Testing

1. **Test SDK locally:**
   ```bash
   cd packages/sdk
   pnpm link --global
   # Use in test project
   ```

2. **Test CLI locally:**
   ```bash
   cd packages/cli
   pnpm link --global
   layer --version
   ```

3. **Test API endpoints:**
   Use tools like:
   - curl
   - Postman
   - Insomnia
   - VS Code REST Client

## Next Steps

Once your environment is set up:

1. Check out [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
2. Look for `good first issue` labels in [GitHub Issues](https://github.com/micah-nettey/layer-ai/issues)
3. Join discussions in [GitHub Discussions](https://github.com/micah-nettey/layer-ai/discussions)

## Getting Help

- **Issues with setup?** Open a [GitHub Issue](https://github.com/micah-nettey/layer-ai/issues)
- **Questions?** Start a [GitHub Discussion](https://github.com/micah-nettey/layer-ai/discussions)
- **Found a bug?** Report it with detailed reproduction steps
