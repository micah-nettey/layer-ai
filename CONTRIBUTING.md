# Contributing to Layer AI

Thank you for your interest in contributing to Layer AI!

## Getting Started

To get started with local development, see [DEVELOPMENT.md](./DEVELOPMENT.md) for complete setup instructions.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to Contribute

### Reporting Bugs

Before creating bug reports, check existing issues to avoid duplicates. Include:

- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, package versions)
- Code samples or error messages

### Suggesting Features

Feature suggestions are welcome! Please:

- Use a clear, descriptive title
- Explain why the feature would be useful
- Provide examples of how it would work

### Pull Requests

1. Fork and clone the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Ensure code builds: `pnpm build`
5. Commit with [conventional commits](#commit-guidelines)
6. Push to your fork
7. Open a Pull Request

## Finding Issues to Work On

- **Good first issues**: Look for [`good first issue`](https://github.com/micah-nettey/layer-ai/labels/good%20first%20issue) label
- **Help wanted**: Check [`help wanted`](https://github.com/micah-nettey/layer-ai/labels/help%20wanted) label
- **Documentation**: Improvements to docs, guides, and examples
- **Providers**: Adding new AI provider integrations

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
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

- `api` - REST API server
- `sdk` - TypeScript SDK
- `cli` - Command-line interface
- `types` - Shared types
- `config` - Config parser

### Examples

```
feat(sdk): add streaming support for completions
fix(cli): handle missing config file gracefully
docs: update installation instructions
```

## Coding Standards

- **TypeScript**: Use TypeScript for all new code with strict mode enabled
- **Formatting**: Run `pnpm format` before committing
- **Testing**: Add tests for new features
- **Types**: Avoid `any` types, leverage `@layer-ai/types` package
- **Documentation**: Add JSDoc comments for public APIs

## Pull Request Process

1. Update relevant documentation
2. Ensure `pnpm build` completes without errors
3. Test your changes manually
4. Keep PRs focused on a single feature/fix
5. Link related issues in the PR description

### PR Title Format

Use the same format as commits:

```
feat(sdk): add streaming support
fix(cli): handle missing config file
```

## Project Structure

```
layer-ai/
├── apps/
│   └── api/          # REST API server
├── packages/
│   ├── sdk/          # TypeScript SDK
│   ├── cli/          # Command-line interface
│   ├── types/        # Shared TypeScript types
│   └── config/       # Config file parser
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed information.

## Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- PRs require at least one approval before merging

## Community

- **Questions?** Ask in [GitHub Discussions](https://github.com/micah-nettey/layer-ai/discussions)
- **Bugs?** Report in [GitHub Issues](https://github.com/micah-nettey/layer-ai/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
