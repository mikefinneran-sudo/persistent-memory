# Setup Guide - Airtable Backend Integration

**Complete setup instructions for the Persistent Memory System with Airtable**

---

## Quick Start (5 Minutes)

### Prerequisites
- Node.js 18 or higher
- Airtable account (free tier works)
- npm or yarn

### Steps

1. **Clone and Install**
```bash
cd persistent-memory
npm install
```

2. **Create Airtable Base**
- Go to https://airtable.com
- Create new base called "Claude Persistent Memory"
- See "Airtable Setup" section below for table schema

3. **Configure Environment**
```bash
cp .env.example .env
```

Edit `.env`:
```env
AIRTABLE_API_KEY=patXXXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXXXX
USER_ID=your-email@example.com
```

4. **Run Migration** (if you have existing file-based data)
```bash
npm run migrate -- --source ~/.claude --dry-run  # Preview first
npm run migrate -- --source ~/.claude            # Actually migrate
```

5. **Test Integration**
```bash
npm run build
node dist/examples/basic-usage.js
```

---

## Airtable Setup

### Option 1: Automatic Setup (Coming Soon)

We'll provide a base template you can copy directly.

### Option 2: Manual Setup

Create a new Airtable base with these tables:

#### Table 1: Users

| Field Name | Type | Options |
|------------|------|---------|
| id | Auto number | |
| userId | Single line text | Required |
| name | Single line text | Required |
| email | Email | Required |
| useCase | Single line text | |
| communicationStyle | Long text | |
| fileConventions | Long text | |
| workflowPrinciples | Long text | |
| defaultLocations | Long text | JSON format |
| preferences | Long text | JSON format |

#### Table 2: Projects

| Field Name | Type | Options |
|------------|------|---------|
| id | Auto number | |
| userId | Single line text | Required |
| projectName | Single line text | Required |
| displayName | Single line text | Required |
| description | Long text | |
| status | Single select | Active, Planning, Research, Paused, Completed, Archived |
| priority | Single select | High, Medium, Low |
| location | Single line text | |
| tags | Multiple select | |
| startDate | Date | |
| lastAccessedAt | Date | |
| completedAt | Date | |

#### Table 3: ProjectContent

| Field Name | Type | Options |
|------------|------|---------|
| id | Auto number | |
| projectId | Number | Links to Projects.id |
| contentType | Single select | README, PROJECT, STATUS, BACKLOG, QUICKREF, DECISIONS, NOTES, CUSTOM |
| customType | Single line text | |
| content | Long text | |
| version | Number | Required |
| isActive | Checkbox | Required |

#### Table 4: WorkingContext

| Field Name | Type | Options |
|------------|------|---------|
| id | Auto number | |
| userId | Single line text | Required |
| weekStart | Date | Required |
| primaryFocus | Single line text | |
| currentProjectId | Number | Links to Projects.id |
| completedTasks | Long text | JSON format |
| activeFiles | Long text | JSON format |
| nextActions | Long text | JSON format |
| openQuestions | Long text | JSON format |
| sessionLog | Long text | JSON format |
| isActive | Checkbox | Required |

#### Table 5: Sessions

| Field Name | Type | Options |
|------------|------|---------|
| id | Auto number | |
| userId | Single line text | Required |
| projectId | Number | Links to Projects.id |
| sessionStart | Date time | Required |
| sessionEnd | Date time | |
| duration | Duration | Calculated field |
| summary | Long text | |
| tasksCompleted | Long text | JSON format |
| filesModified | Long text | JSON format |
| notes | Long text | |

---

## Getting API Credentials

### Airtable API Key (Personal Access Token)

1. Go to https://airtable.com/create/tokens
2. Click "Create new token"
3. Name it "Claude Persistent Memory"
4. Add these scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
5. Add access to your "Claude Persistent Memory" base
6. Click "Create token"
7. Copy the token (starts with `pat`)

### Airtable Base ID

1. Go to your Airtable base
2. Click "Help" → "API documentation"
3. Find the Base ID (starts with `app`)
4. Or look at the URL: `airtable.com/appXXXXXXXXXX/...`

---

## Configuration Options

### Environment Variables

```bash
# Required
AIRTABLE_API_KEY=patXXXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXXXX
USER_ID=your-email@example.com

# Optional
CACHE_ENABLED=true              # Enable caching (default: true)
CACHE_TTL=300                   # Cache TTL in seconds (default: 300)
CACHE_MAX_SIZE=100              # Max cache items (default: 100)
RETRY_ATTEMPTS=3                # Retry attempts (default: 3)
RETRY_DELAY=1000                # Retry delay in ms (default: 1000)
```

### Programmatic Configuration

```typescript
import { MemoryClient, createConfig } from '@claude/persistent-memory';

const config = createConfig({
  apiKey: process.env.AIRTABLE_API_KEY!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  userId: process.env.USER_ID!,
  cache: {
    enabled: true,
    ttl: 600, // 10 minutes
    maxSize: 200,
  },
  retryAttempts: 5,
  retryDelay: 2000,
});

const client = new MemoryClient(config);
```

---

## Migration from File-Based System

### Pre-Migration Checklist

- [ ] Backup your `~/.claude` directory
- [ ] Create Airtable base and tables
- [ ] Configure `.env` file
- [ ] Run dry-run migration first

### Migration Command

```bash
# Preview migration (no changes)
npm run migrate -- --source ~/.claude --dry-run

# Run actual migration
npm run migrate -- --source ~/.claude

# Migrate from custom location
npm run migrate -- --source /path/to/claude/data
```

### What Gets Migrated

✅ **User Preferences** (CLAUDE.md)
- Name, email, use case
- Communication style
- File conventions
- Workflow principles

✅ **Project Registry** (PROJECT-REGISTRY.md)
- All projects with status and priority
- Project metadata

✅ **Project Content** (projects/*/\*.md)
- README, PROJECT, STATUS, BACKLOG
- QUICKREF, DECISIONS, NOTES
- All markdown content preserved

✅ **Working Context** (WORKING-CONTEXT.md)
- Current focus
- Next actions
- Open questions

❌ **Not Migrated**
- Session history (can be extracted manually)
- Git history
- Archived projects (must be migrated separately)

### Post-Migration

After migration, verify:

```bash
# Build and test
npm run build

# Run example to verify
node dist/examples/basic-usage.js
```

---

## Usage Examples

### Basic Usage

```typescript
import { MemoryClient, getConfig } from '@claude/persistent-memory';

const client = new MemoryClient(getConfig());

// Load session
const session = await client.loadSession();
console.log('Current focus:', session.context?.primaryFocus);

// Create project
const project = await client.createProject(
  'my-project',
  'My Project',
  { status: 'Active', priority: 'High' }
);

// Update content
await client.updateProjectContent(
  'my-project',
  'STATUS',
  '# Status\n\nProject is going well!'
);

// Switch context
await client.switchToProject('my-project');
```

### Advanced Usage

See `examples/basic-usage.ts` for comprehensive examples.

---

## Troubleshooting

### "Missing required environment variables"

**Cause**: `.env` file not configured

**Solution**:
```bash
cp .env.example .env
# Edit .env with your credentials
```

### "Invalid API key"

**Cause**: Incorrect Airtable Personal Access Token

**Solution**:
1. Verify token at https://airtable.com/create/tokens
2. Ensure token has correct scopes
3. Check token has access to your base

### "Table not found"

**Cause**: Airtable base not set up correctly

**Solution**:
1. Verify base ID in `.env`
2. Ensure all 5 tables exist
3. Check table names match exactly (case-sensitive)

### "Rate limit exceeded"

**Cause**: Too many API requests

**Solution**:
1. Enable caching in `.env`: `CACHE_ENABLED=true`
2. Increase retry delay: `RETRY_DELAY=2000`
3. Wait a few minutes and try again

### Migration fails

**Cause**: Source files not found or malformed

**Solution**:
1. Verify source path exists: `ls ~/.claude`
2. Check file formats are valid
3. Run with `--dry-run` to preview issues
4. Check migration logs for specific errors

---

## Performance Tips

### 1. Enable Caching
```bash
CACHE_ENABLED=true
CACHE_TTL=600  # 10 minutes
```

### 2. Batch Operations
```typescript
// Instead of multiple calls
await client.updateProjectContent('proj', 'STATUS', '...');
await client.updateProjectContent('proj', 'BACKLOG', '...');

// Use Promise.all
await Promise.all([
  client.updateProjectContent('proj', 'STATUS', '...'),
  client.updateProjectContent('proj', 'BACKLOG', '...'),
]);
```

### 3. Use Filters
```typescript
// Only fetch active projects
await client.listProjects('Active');

// Instead of all projects
await client.listProjects();
```

---

## Security Best Practices

### 1. Protect API Keys
- Never commit `.env` to version control
- Use environment variables in production
- Rotate keys periodically

### 2. Limit Token Scope
- Only grant required scopes
- Only grant access to specific bases
- Use separate tokens for dev/prod

### 3. Data Privacy
- Airtable stores data in cloud (US/EU)
- Consider data sensitivity
- Use Airtable Enterprise for self-hosting

---

## Next Steps

Once setup is complete:

1. **Explore the SDK**: Review `src/index.ts` for available methods
2. **Run Examples**: Try `examples/basic-usage.ts`
3. **Read Schema Docs**: See `AIRTABLE-SCHEMA.md` for data model
4. **Integrate**: Use the SDK in your Claude Code workflows

---

## Support

**Documentation**: See `AIRTABLE-SCHEMA.md`, `README.md`, `PROJECT.md`

**Issues**: Create an issue in this repository

**Airtable Help**: https://support.airtable.com

---

**Version**: 2.0.0
**Last Updated**: 2025-11-03
