---
name: persistent-memory
description: Airtable-backed persistent memory system for Claude Code with TypeScript SDK
version: 2.0.0
author: Mike Finneran
license: MIT
allowed-tools:
  - read
  - write
  - bash
  - git
last-reviewed: 2025-11-04
tags:
  - typescript
  - airtable
  - sdk
  - memory-system
  - claude-code
---

# Persistent Memory System - Project Context

## Repository Overview

**What**: TypeScript SDK for Airtable-backed persistent memory system enabling Claude to remember context across sessions

**Purpose**: Solve the "context gap" where Claude starts each session with no memory of previous work

**Status**: Production-ready v2.0 with Airtable backend integration

**Key Features**:
- Cloud sync via Airtable
- Structured data with relationships
- TypeScript SDK with type safety
- Caching and retry logic
- Migration tools from file-based v1.0

## Quick Start

**New to this project?** Start here:

1. **Setup**: Read `@SETUP.md` for Airtable configuration
2. **Install**: `npm install`
3. **Configure**: Copy `.env.example` to `.env`, add Airtable credentials
4. **Build**: `npm run build`
5. **Test**: `npm test`
6. **Architecture**: Read `@PROJECT.md` for system design
7. **Schema**: Reference `@AIRTABLE-SCHEMA.md` for database structure

**Common workflows**:
- Add feature → Edit code → Write tests → `npm run build && npm test` → Commit
- Debug Airtable → Check `.env` → Verify `@AIRTABLE-SCHEMA.md` → Review retry logic
- Migrate from v1.0 → Read `@SETUP.md` migration section → Run `npm run migrate`

## Tech Stack

### Core Technologies
- **Runtime**: Node.js ≥18.0.0
- **Language**: TypeScript 5.3+ (strict mode enabled)
- **Database**: Airtable (cloud backend)
- **Testing**: Jest 29+ with ts-jest
- **Build**: TypeScript compiler (tsc)

### Key Dependencies
- `airtable`: ^0.12.2 - Official Airtable SDK
- `dotenv`: ^16.4.5 - Environment configuration
- TypeScript with strict mode, ES2022 target

### Development Tools
- ESLint with TypeScript parser
- Jest for unit tests
- ts-node for scripts
- Git with conventional commits

## Project Structure

```
persistent-memory/
├── src/
│   ├── services/
│   │   ├── airtable.ts          # Low-level Airtable API client
│   │   └── memory-client.ts     # High-level memory operations
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── config/
│   │   └── index.ts             # Configuration management
│   ├── utils/
│   │   ├── cache.ts             # In-memory caching layer
│   │   └── retry.ts             # Retry logic with exponential backoff
│   ├── scripts/
│   │   └── migrate.ts           # Migration from file-based v1.0
│   └── __tests__/               # Jest test suites
│
├── examples/                     # Usage examples
├── docs/                        # Markdown documentation
│   ├── PROJECT.md               # Architecture overview
│   ├── SETUP.md                 # Setup instructions
│   ├── AIRTABLE-SCHEMA.md       # Database schema
│   └── USER-GUIDE.md            # End-user guide
│
├── dist/                        # Compiled JavaScript (gitignored)
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Jest configuration
├── package.json                 # NPM manifest
└── .env                         # Environment variables (gitignored)
```

## Core Files & Responsibilities

### Services Layer
- **`services/airtable.ts`**: Low-level Airtable CRUD operations, connection management
- **`services/memory-client.ts`**: High-level API (loadSession, saveProject, getPreferences, etc.)

### Types
- **`types/index.ts`**: All TypeScript interfaces and types (User, Project, WorkingContext, Session, etc.)

### Utilities
- **`utils/cache.ts`**: TTL-based in-memory cache to reduce API calls
- **`utils/retry.ts`**: Exponential backoff retry logic for API resilience

### Configuration
- **`config/index.ts`**: Loads and validates environment variables from `.env`

### Scripts
- **`scripts/migrate.ts`**: Migrates data from file-based v1.0 to Airtable backend

## Commands

### Build & Development
```bash
npm run build          # Compile TypeScript to dist/
npm run watch          # Compile in watch mode
npm run lint           # Run ESLint on src/
```

### Testing
```bash
npm test               # Run all Jest tests
npm run test:watch     # Run tests in watch mode
```

### Migration
```bash
npm run migrate        # Run migration script (uses ts-node)
```

### Package Management
```bash
npm install            # Install dependencies
npm ci                 # Clean install (CI environments)
```

## Code Style & Conventions

### TypeScript
- **Strict mode**: All strict TypeScript checks enabled
- **Target**: ES2022 (modern JavaScript features)
- **Module**: CommonJS for Node.js compatibility
- **Imports**: Use ES6 import/export syntax, CommonJS compiled output
- **Types**: Explicit return types on all exported functions
- **Null safety**: Use strict null checks, prefer undefined over null

### File Naming
- **Source files**: `kebab-case.ts` (e.g., `memory-client.ts`)
- **Test files**: `kebab-case.test.ts` colocated with source
- **Types**: Centralized in `types/index.ts`
- **Docs**: `UPPERCASE-HYPHENATED.md` (e.g., `SETUP.md`)

### Function & Variable Naming
- **Functions**: `camelCase`, verbs (e.g., `loadSession`, `saveProject`)
- **Classes**: `PascalCase`, nouns (e.g., `MemoryClient`, `AirtableService`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_CACHE_TTL`)
- **Interfaces**: `PascalCase` (e.g., `User`, `Project`, `Config`)
- **Private members**: Prefix with `_` (e.g., `_cache`)

### Code Organization
- One export per file for services/clients (e.g., `MemoryClient` in `memory-client.ts`)
- Group related types in `types/index.ts`
- Keep functions small (<50 lines)
- Extract reusable logic to `utils/`

### Error Handling
- Always use `try/catch` for async operations
- Throw descriptive errors with context
- Use retry logic for transient API failures
- Log errors before rethrowing
- Never swallow errors silently

### Comments
- Use JSDoc for public APIs (functions, classes, types)
- Inline comments only for non-obvious logic
- Prefer self-documenting code over excessive comments
- Document **why**, not **what**

## Airtable Integration Rules

### Schema Adherence
- Follow schema defined in `@AIRTABLE-SCHEMA.md` exactly
- Never create/modify tables outside documented schema
- Use linked records for relationships (Users → Projects, Projects → ProjectContent)
- Reference `@AIRTABLE-SCHEMA.md` before any database operations

### API Usage
- Always use retry logic (imported from `utils/retry.ts`)
- Cache reads when appropriate (use `utils/cache.ts`)
- Batch operations when possible (not yet implemented)
- Rate limit awareness: 5 requests/second per base

### Field Naming
- Airtable fields use `PascalCase` (e.g., `ProjectName`, `UserId`)
- TypeScript types use `camelCase` (e.g., `projectName`, `userId`)
- Transform between conventions in `services/airtable.ts`

## Testing Standards

### Test Coverage
- All service methods must have unit tests
- Test success paths and error conditions
- Mock Airtable API calls (never hit real API in tests)
- Aim for >80% code coverage

### Test Organization
- Colocate tests with source in `__tests__/`
- One test file per source file
- Use `describe` blocks to group related tests
- Use `it` or `test` for individual test cases

### Test Naming
- Pattern: `should [expected behavior] when [condition]`
- Example: `should return cached user when cache is valid`

## Git & Version Control

### Commit Format (Conventional Commits)
- **Format**: `<type>(<scope>): <subject>`
- **Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`
- **Scopes**: `airtable`, `cache`, `client`, `types`, `config`, `docs`, `ci`
- **Examples**:
  - `feat(client): add loadProject method`
  - `fix(cache): prevent race condition on concurrent reads`
  - `docs(setup): clarify Airtable API key requirements`

### Branch Strategy
- **Main branch**: `main` (not `master`)
- **Feature branches**: `claude/[feature-name]-[session-id]`
- **Always push with**: `git push -u origin <branch-name>`
- **Retry on network errors**: Up to 4 times with exponential backoff (2s, 4s, 8s, 16s)

### What to Commit
- ✅ Source code (`src/`)
- ✅ Tests (`__tests__/`)
- ✅ Documentation (`.md` files)
- ✅ Configuration (`tsconfig.json`, `jest.config.js`, `package.json`)
- ✅ Example files (`examples/`)
- ❌ Build artifacts (`dist/`)
- ❌ Environment variables (`.env`)
- ❌ Node modules (`node_modules/`)
- ❌ IDE files (`.vscode/`, `.idea/`)

## Environment Configuration

### Required Variables
```bash
AIRTABLE_API_KEY=key...          # Airtable personal access token
AIRTABLE_BASE_ID=app...          # Base ID for Claude Persistent Memory
```

### Optional Variables
```bash
CACHE_TTL_MS=300000              # Cache TTL (default: 5 minutes)
MAX_RETRIES=3                    # Max API retry attempts (default: 3)
```

### Setup
1. Copy `.env.example` to `.env`
2. Fill in Airtable credentials from Airtable account
3. Never commit `.env` to Git

## Project-Specific Rules

### Memory System Concepts
- **User**: Global preferences (Layer 1)
- **Project**: Individual project context (Layer 3)
- **ProjectContent**: Project documentation files (STATUS, BACKLOG, README)
- **WorkingContext**: Current weekly focus (Layer 4)
- **Session**: Individual Claude Code session history

### Data Flow
1. Session starts → Load User preferences + WorkingContext
2. Continue project → Load Project + ProjectContent
3. Work is done → Update WorkingContext + ProjectContent
4. Session ends → Save all changes to Airtable

### Token Budget Awareness
- Keep CLAUDE.md files focused (<400 lines for project root, <200 for subdirectories)
- Keep project documentation lean - use `@filename` to reference external docs
- Archive old content, don't let files bloat
- External docs in root and `docs/` folder: `@PROJECT.md`, `@SETUP.md`, `@AIRTABLE-SCHEMA.md`, `@USER-GUIDE.md`
- Reference external docs on-demand rather than duplicating content here

## Do Not Section (Guardrails)

### Never Do These:
- ❌ **Don't rewrite working code** without explicit request or clear bug
- ❌ **Don't skip type definitions** - all functions must have types
- ❌ **Don't use `any` type** - use `unknown` and type guards instead
- ❌ **Don't commit `.env` files** - warn immediately if detected
- ❌ **Don't modify Airtable schema** without documenting in `@AIRTABLE-SCHEMA.md`
- ❌ **Don't skip error handling** on Airtable API calls
- ❌ **Don't break the build** - always run `npm run build` before committing
- ❌ **Don't skip tests** - run `npm test` before pushing
- ❌ **Don't use deprecated Airtable APIs** - check SDK version compatibility
- ❌ **Don't make destructive data changes** without explicit confirmation

### Always Do These:
- ✅ **Always** validate environment variables exist before using
- ✅ **Always** use retry logic for Airtable API calls
- ✅ **Always** check cache before hitting Airtable
- ✅ **Always** use TypeScript strict mode features
- ✅ **Always** document new types in `types/index.ts`
- ✅ **Always** update `@AIRTABLE-SCHEMA.md` when schema changes
- ✅ **Always** write tests for new service methods
- ✅ **Always** use conventional commit format

### Ask First:
- Adding new npm dependencies
- Changing Airtable schema
- Breaking changes to public SDK API
- Large refactors (>5 files)
- Performance optimizations that reduce clarity

## Documentation Maintenance

### When to Update Docs
- **`@PROJECT.md`**: When architecture or design decisions change
- **`@AIRTABLE-SCHEMA.md`**: When adding/modifying Airtable tables or fields
- **`@SETUP.md`**: When setup process changes (new env vars, requirements)
- **`@USER-GUIDE.md`**: When user-facing features change
- **This file (`CLAUDE.md`)**: When project conventions or rules change

### Doc Style
- Use Markdown with clear headings
- Include code examples for complex concepts
- Keep language concise and technical
- Use tables for reference information
- Update "Last Updated" timestamps

## Common Tasks

### Add New Service Method
1. Define TypeScript signature in service class
2. Implement with proper error handling and retry logic
3. Add cache layer if applicable
4. Write unit tests with mocks
5. Update JSDoc comments
6. Run `npm run build && npm test`

### Modify Airtable Schema
1. Update `@AIRTABLE-SCHEMA.md` first (documentation)
2. Make changes in Airtable UI
3. Update TypeScript types in `types/index.ts`
4. Update `services/airtable.ts` mapping logic
5. Run tests, update mocks if needed
6. Document breaking changes in commit message

### Debug Airtable API Issues
1. Check `.env` file for correct credentials
2. Verify Airtable base schema matches `@AIRTABLE-SCHEMA.md`
3. Check Airtable API rate limits (5 req/sec)
4. Review retry logic in `utils/retry.ts`
5. Enable debug logging if available
6. Reference `@SETUP.md` for troubleshooting guide

---

## Version History

### v2.0.0 (2025-11-04)
- Added elite-tier CLAUDE.md with YAML frontmatter
- Quick Start section for new contributors
- External documentation references using `@filename` pattern
- Token budget guidance updated (<400 lines for root, <200 for subdirectories)
- Enhanced with step-by-step workflows for common tasks
- Comprehensive guardrails in "Do Not" and "Always Do" sections

### v1.0.0 (2025-10-27)
- Initial file-based persistent memory system
- 4-layer architecture (Global, Registry, Projects, Working Context)
- Markdown-based documentation structure
- Local file storage in `~/.claude/` directory

---

**This file is automatically loaded when working in this project directory. Global preferences in `~/.claude/CLAUDE.md` are also active; project rules take precedence on conflicts.**
