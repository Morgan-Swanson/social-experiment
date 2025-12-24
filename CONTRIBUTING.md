# Contributing to Social Experiment

Thank you for your interest in contributing to Social Experiment! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18.x or 20.x
- Docker and Docker Compose
- PostgreSQL
- Git

### Getting Started

1. Fork the repository on GitHub

2. Clone your fork:
```bash
git clone https://github.com/Morgan-Swanson/social-experiment.git
cd social-experiment
```

3. Install dependencies:
```bash
npm install
```

4. Copy the environment file:
```bash
cp .env.example .env
```

5. Configure your `.env` file with local settings

6. Start the local storage service:
```bash
npm run docker:up
```

7. Initialize the database:
```bash
npm run db:push
npm run db:seed
```

8. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

## Project Structure

```
social-experiment/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   └── dashboard/    # Main application pages
│   ├── components/       # React components
│   ├── lib/             # Utilities and adapters
│   │   ├── adapters/    # External service adapters (AI, storage)
│   │   └── __tests__/   # Unit tests
│   └── types/           # TypeScript type definitions
├── prisma/              # Database schema and migrations
├── terraform/           # Infrastructure as code
├── docs/               # Documentation
└── public/             # Static assets
```

## Development Workflow

### Making Changes

1. Create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and test them locally

3. Run the test suite:
```bash
npm test
npm run test:coverage
```

4. Lint your code:
```bash
npm run lint
```

5. Commit your changes:
```bash
git commit -m "feat: add your feature description"
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `test:` test additions or changes
- `refactor:` code refactoring
- `chore:` maintenance tasks

6. Push to your fork:
```bash
git push origin feature/your-feature-name
```

7. Open a Pull Request on GitHub

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Database Changes

When making database schema changes:

1. Update `prisma/schema.prisma`

2. Generate types:
```bash
npm run db:generate
```

3. Create a migration:
```bash
npm run db:migrate
```

4. Update seed data if necessary in `prisma/seed.ts`

### Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Architecture Guidelines

### Key Patterns

1. **Adapter Pattern**: External services (AI, storage) are wrapped in adapters (`src/lib/adapters/`)

2. **API Routes**: Backend logic lives in Next.js API routes (`src/app/api/`)

3. **Server Components**: Default to server components, use client components only when needed

4. **Type Safety**: Define types in `src/types/` and use them throughout

### Adding New Features

#### New Classifier Type

1. Update the database schema in `prisma/schema.prisma`
2. Add UI components in `src/app/dashboard/classifiers/`
3. Update API routes in `src/app/api/classifiers/`
4. Add tests

#### New AI Provider

1. Create adapter in `src/lib/adapters/`
2. Implement the provider interface
3. Add configuration options
4. Add tests
5. Update documentation

#### New Storage Backend

1. Create adapter in `src/lib/adapters/storage/`
2. Implement upload/download methods
3. Add configuration
4. Add tests
5. Update deployment docs

## Testing Guidelines

### What to Test

- Business logic in adapters and utilities
- API route handlers
- Complex UI components
- Database operations
- Error handling

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

## Documentation

When adding features:

1. Update README.md if it affects setup or usage
2. Add JSDoc comments to public APIs
3. Update architecture docs in `docs/` if needed
4. Include examples in commit messages

## Pull Request Guidelines

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Code follows existing style
- [ ] Commits follow conventional commits format
- [ ] Documentation is updated
- [ ] Branch is up to date with main

### PR Description

Include:
- What the PR does
- Why the change is needed
- How to test it
- Screenshots (for UI changes)
- Related issues

## Getting Help

- Check existing [documentation](docs/)
- Search [existing issues](https://github.com/Morgan-Swanson/social-experiment/issues)
- Ask in [GitHub Discussions](https://github.com/Morgan-Swanson/social-experiment/discussions)
- Read the code - it's well-structured!

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

## License

By contributing, you agree that your contributions will be licensed under the GPL-3.0 License.