# CLAUDE.md Airtable Integration

## Overview

The Airtable integration seamlessly syncs both global and project-specific CLAUDE.md files to the cloud, ensuring your preferences and project context are always accessible.

## Two Types of CLAUDE.md Files

### 1. Global CLAUDE.md (`~/.claude/CLAUDE.md`)

**Purpose:** Your personal preferences used across all Claude Code sessions

**Syncs to:** `Users` table in Airtable

**Contains:**
- Name and email
- Use case / what you do
- Communication style preferences
- File conventions
- Workflow principles

**Example structure:**
```markdown
## Who I Am
Name: Mike Finneran
Email: mike@example.com

## Use Case
Full-stack developer working on...

## Communication Style
I prefer concise, direct communication...

## File Conventions
- Use TypeScript for all new code
- Follow ESLint rules

## Workflow
- Always run tests before committing
- Use conventional commits
```

### 2. Project CLAUDE.md (`/path/to/project/CLAUDE.md`)

**Purpose:** Project-specific context, goals, and configuration

**Syncs to:** `ProjectContent` table (NOTES type)

**Contains:**
- Project overview
- Current goals and objectives
- Technical context
- Active tasks
- Project-specific rules

**Example structure:**
```markdown
## Project Overview
This is the persistent-memory project for Claude Code...

## Current Goals
- Integrate Airtable backend
- Add command parsing system
- Create standalone NPM package

## Technical Context
- TypeScript SDK
- 6-table Airtable schema
- Migration tools included

## Active Tasks
- Push to GitHub
- Publish to NPM
```

## How Migration Works

### Non-Destructive Process

**Important:** The migration script **NEVER** modifies or deletes your local CLAUDE.md files. They remain intact on your filesystem.

### What Happens During Migration

```bash
npm run migrate -- --source ~/.claude
```

**Step 1:** Reads `~/.claude/CLAUDE.md`
- Parses sections
- Syncs to Airtable Users table
- Local file remains untouched

**Step 2:** Checks current directory for `CLAUDE.md`
- If found, syncs to ProjectContent
- Creates project if it doesn't exist
- Local file remains untouched

**Step 3:** Both files continue to work locally
- Claude Code still reads them
- Airtable has cloud backup
- You can edit either location

## Benefits of Airtable Sync

### ✅ Cloud Backup
Your CLAUDE.md files are backed up to Airtable automatically

### ✅ Multi-Device Access
Access your preferences from any device with Airtable access

### ✅ Version History
Airtable tracks changes over time

### ✅ Team Sharing
Share project-specific context with team members

### ✅ API Access
Programmatically read/write preferences via SDK

## Usage Examples

### Initial Migration

```bash
# Dry run to preview what will be migrated
npm run migrate -- --source ~/.claude --dry-run

# Run actual migration
npm run migrate -- --source ~/.claude
```

### Ongoing Sync

```typescript
import { MemoryClient } from '@mikefinneran-sudo/claude-airtable-memory';

const client = new MemoryClient({
  airtableApiKey: process.env.AIRTABLE_API_KEY,
  airtableBaseId: process.env.AIRTABLE_BASE_ID,
  userId: 'your-user-id'
});

// Read your synced preferences
const user = await client.getUserPreferences();
console.log(user.communicationStyle);

// Update preferences
await client.updatePreferences({
  communicationStyle: 'Updated style...'
});

// Read project-specific CLAUDE.md
const projectNotes = await client.getProjectContent('persistent-memory', 'NOTES');
console.log(projectNotes.content);
```

### Manual Sync Script

Create a sync script to keep CLAUDE.md in sync:

```typescript
// sync-claude.ts
import { MemoryClient } from '@mikefinneran-sudo/claude-airtable-memory';
import * as fs from 'fs';
import * as path from 'path';

async function syncCLAUDE() {
  const client = new MemoryClient({...});

  // Read local CLAUDE.md
  const claudePath = path.join(process.cwd(), 'CLAUDE.md');
  const content = fs.readFileSync(claudePath, 'utf-8');

  // Sync to Airtable
  const projectName = path.basename(process.cwd());
  await client.updateProjectContent(projectName, 'NOTES', content);

  console.log('✓ CLAUDE.md synced to Airtable');
}

syncCLAUDE();
```

## File Precedence

When Claude Code starts:

1. **Reads local files first** (fastest)
2. **Falls back to Airtable** if local files missing
3. **Merges both** if both exist (local takes precedence)

## Best Practices

### ✅ DO

- Edit CLAUDE.md locally for quick changes
- Run migration periodically to sync to cloud
- Use Airtable for team collaboration
- Keep global preferences in `~/.claude/CLAUDE.md`
- Keep project context in project-local `CLAUDE.md`

### ❌ DON'T

- Don't edit in both places simultaneously (sync conflicts)
- Don't delete local files expecting Airtable to be the source
- Don't store secrets in CLAUDE.md (it syncs to cloud)

## Troubleshooting

### Migration says "CLAUDE.md not found"

**Solution:** Check file path and ensure file exists:
```bash
ls -la ~/.claude/CLAUDE.md
ls -la ./CLAUDE.md
```

### Changes not syncing

**Solution:** Run migration again:
```bash
npm run migrate
```

### Want to pull from Airtable to local

**Solution:** Use the SDK to fetch and write to local file:
```typescript
const user = await client.getUserPreferences();
fs.writeFileSync('~/.claude/CLAUDE.md', formatUserToMarkdown(user));
```

## Summary

- **Two CLAUDE.md files:** Global (`~/.claude/`) and Project (`./.`)
- **Non-destructive:** Local files never deleted or modified
- **Cloud sync:** Automatic backup to Airtable
- **Best of both worlds:** Local speed + cloud access
- **Your files are safe:** Migration only reads, never writes to local files

---

For more information, see:
- [Airtable Schema](./AIRTABLE-SCHEMA.md)
- [Migration Guide](./src/scripts/migrate.ts)
- [SDK Documentation](../claude-airtable-memory/README.md)
