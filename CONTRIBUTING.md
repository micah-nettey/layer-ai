# Contributing to Layer AI

Thank you for your interest in contributing to Layer AI! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Exact steps to reproduce the problem
- Expected behavior vs actual behavior
- Environment details (OS, Node.js version, package versions)
- Code samples or error messages (use code blocks)

### Suggesting Features

Feature suggestions are welcome! Please:

- Use a clear and descriptive title
- Provide a detailed description of the proposed feature
- Explain why this feature would be useful
- Include examples of how it would work

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Ensure the code builds (`pnpm build`)
5. Commit your changes (see commit guidelines below)
6. Push to your fork
7. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+ (for running the API)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/your-username/layer-ai.git
cd layer-ai

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Project Structure

```
layer-ai/
├── apps/
│   └── api/                  # REST API server
│       ├── src/
│       │   ├── routes/       # API endpoints
│       │   ├── services/     # Business logic
│       │   ├── middleware/   # Auth, rate limiting
│       │   └── lib/          # DB, utilities
│       └── package.json
│
├── packages/
│   ├── sdk/                  # TypeScript SDK
│   │   └── src/
│   │       ├── client.ts     # Main Layer class
│   │       └── resources/    # Gates, Keys, Logs
│   │
│   ├── cli/                  # Command-line interface
│   │   └── src/
│   │       ├── commands/     # CLI commands
│   │       └── lib/          # Helpers
│   │
│   ├── types/                # Shared TypeScript types
│   │   └── src/
│   │       ├── api.ts
│   │       ├── gates.ts
│   │       └── models.ts
│   │
│   └── config/               # Config file parser
│       └── src/
│           ├── parser.ts     # YAML parser
│           └── schema.ts     # Validation
│
├── README.md
├── LICENSE
└── package.json
```

### Running the API Server

```bash
# Set up PostgreSQL database first
# See apps/api/README.md for database setup

# Development mode with hot reload
pnpm --filter @layer-ai/api dev

# The API will be available at http://localhost:3001
```

### Working on the SDK

```bash
# Watch mode for development
pnpm --filter @layer-ai/sdk dev

# Build
pnpm --filter @layer-ai/sdk build
```

### Working on the CLI

```bash
# Build the CLI
pnpm --filter @layer-ai/cli build

# Test locally (link globally)
cd packages/cli
pnpm link --global

# Now you can use 'layer' command globally
layer --help
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Provide type annotations for public APIs
- Avoid `any` types when possible
- Leverage types from `@layer-ai/types` package

### Code Style

- Use Prettier for formatting (run `pnpm format`)
- Follow existing code patterns
- Keep functions small and focused
- Write self-documenting code with clear variable names
- Add JSDoc comments for public APIs

### Building

Ensure your changes build successfully:

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @layer-ai/sdk build
```

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Scopes

Use the package or app name as scope:
- `api` - REST API server
- `sdk` - TypeScript SDK
- `cli` - Command-line interface
- `types` - Shared types
- `config` - Config parser

### Examples

```
feat(sdk): add streaming support for completions

Implement streaming completions using Server-Sent Events (SSE).
Adds new `stream` parameter to completion requests.

Closes #123
```

```
fix(cli): handle missing config file gracefully

Previously crashed when layer.config.yaml was missing.
Now shows helpful error message and suggests running 'layer init'.

Fixes #456
```

```
feat(api): add Google Gemini provider support

Adds integration with Google Gemini models.
Supports gemini-2.0-flash-exp and other variants.

Related to #789
```

## Pull Request Process

1. **Update Documentation**: Update README.md or other docs if needed
2. **Build Successfully**: Ensure `pnpm build` completes without errors
3. **Test Manually**: Verify your changes work as expected
4. **Single Responsibility**: Keep PRs focused on a single feature/fix
5. **Link Issues**: Reference related issues in the PR description

### PR Title Format

Follow the same convention as commits:

```
feat(sdk): add streaming support
fix(cli): handle missing config file
docs: update installation instructions
```

## Areas for Contribution

### Good First Issues

Look for issues labeled `good-first-issue`:
- Documentation improvements
- Adding examples
- Fixing typos
- Small bug fixes

### High Impact Areas

- **SDK Features**: Streaming, batch requests, retry logic
- **CLI Commands**: Logs, completions, profile management
- **API Routes**: Request caching, rate limiting
- **Documentation**: Guides, examples, tutorials
- **Testing**: Set up test framework and add tests

## Review Process

- Maintainers will review your PR
- Address feedback and requested changes
- Once approved, a maintainer will merge your PR
- PRs require at least one approval before merging

## Community

- Ask questions in [GitHub Discussions](https://github.com/micah-nettey/layer-ai/discussions)
- Report bugs in [GitHub Issues](https://github.com/micah-nettey/layer-ai/issues)

## License

By contributing to Layer AI, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue or discussion if you have questions about contributing!
