# Airtable Schema Design for Persistent Memory System

**Last Updated**: 2025-11-03

---

## Overview

This document defines the Airtable base structure for the persistent memory system, replacing the file-based Markdown approach with a cloud-based relational database.

---

## Base Structure

**Base Name**: `Claude Persistent Memory`

**Tables**: 6 core tables

1. **Users** - Global user preferences
2. **Projects** - Project registry and metadata
3. **ProjectContent** - Detailed project documentation
4. **WorkingContext** - Current focus and session tracking
5. **Sessions** - Session history and logs
6. **PromptingRules** - Natural language command rules and behavioral preferences (NEW in v2.1)

---

## Table 1: Users

**Purpose**: Stores global user preferences (replaces CLAUDE.md)

### Fields

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `id` | Auto number | Primary key | Yes |
| `userId` | Single line text | Unique user identifier (email or username) | Yes |
| `name` | Single line text | User's full name | Yes |
| `email` | Email | User's email address | Yes |
| `useCase` | Single line text | Primary use case (e.g., "Software Development") | No |
| `communicationStyle` | Long text | Preferred communication style | No |
| `fileConventions` | Long text | File naming and organization preferences | No |
| `workflowPrinciples` | Long text | General workflow preferences | No |
| `defaultLocations` | Long text | Default file paths and locations (JSON format) | No |
| `preferences` | Long text | Additional preferences (JSON format) | No |
| `createdAt` | Created time | When record was created | Auto |
| `updatedAt` | Last modified time | When record was last updated | Auto |

### Indexes
- Unique index on `userId`

---

## Table 2: Projects

**Purpose**: Project registry and metadata (replaces PROJECT-REGISTRY.md)

### Fields

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `id` | Auto number | Primary key | Yes |
| `userId` | Single line text | Links to Users.userId | Yes |
| `projectName` | Single line text | Unique project identifier | Yes |
| `displayName` | Single line text | Human-readable project name | Yes |
| `description` | Long text | 1-2 sentence project description | No |
| `status` | Single select | Active, Planning, Research, Paused, Completed, Archived | Yes |
| `priority` | Single select | High, Medium, Low | Yes |
| `location` | Single line text | Legacy file path (for migration) | No |
| `tags` | Multiple select | Project tags/categories | No |
| `startDate` | Date | When project started | No |
| `lastAccessedAt` | Date | Last time project was accessed | No |
| `completedAt` | Date | When project was completed | No |
| `createdAt` | Created time | When record was created | Auto |
| `updatedAt` | Last modified time | When record was last updated | Auto |

### Relationships
- Many-to-one with Users (via `userId`)
- One-to-many with ProjectContent
- One-to-many with Sessions

### Indexes
- Composite unique index on (`userId`, `projectName`)

---

## Table 3: ProjectContent

**Purpose**: Stores project documentation (replaces project workspace files)

### Fields

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `id` | Auto number | Primary key | Yes |
| `projectId` | Link to another record | Links to Projects.id | Yes |
| `contentType` | Single select | README, PROJECT, STATUS, BACKLOG, QUICKREF, DECISIONS, NOTES, CUSTOM | Yes |
| `customType` | Single line text | If contentType=CUSTOM, the custom type name | No |
| `content` | Long text | The actual content (Markdown format) | Yes |
| `version` | Number | Version number for history tracking | Yes |
| `isActive` | Checkbox | Whether this is the active version | Yes |
| `createdAt` | Created time | When record was created | Auto |
| `updatedAt` | Last modified time | When record was last updated | Auto |

### Relationships
- Many-to-one with Projects (via `projectId`)

### Indexes
- Index on (`projectId`, `contentType`, `isActive`)

### Notes
- Multiple versions can exist; `isActive=true` indicates current version
- Content stored as Markdown for compatibility with current system
- Default content types align with file-based structure

---

## Table 4: WorkingContext

**Purpose**: Tracks current focus and weekly work (replaces WORKING-CONTEXT.md)

### Fields

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `id` | Auto number | Primary key | Yes |
| `userId` | Single line text | Links to Users.userId | Yes |
| `weekStart` | Date | Start of the week (Monday) | Yes |
| `primaryFocus` | Single line text | Main focus for the week | No |
| `currentProjectId` | Link to another record | Currently active project | No |
| `completedTasks` | Long text | Tasks completed this week (JSON array) | No |
| `activeFiles` | Long text | Currently active files/locations (JSON array) | No |
| `nextActions` | Long text | Next actions to take (JSON array) | No |
| `openQuestions` | Long text | Open questions/blockers (JSON array) | No |
| `sessionLog` | Long text | Session notes (JSON array) | No |
| `isActive` | Checkbox | Whether this is the current week | Yes |
| `createdAt` | Created time | When record was created | Auto |
| `updatedAt` | Last modified time | When record was last updated | Auto |

### Relationships
- Many-to-one with Users (via `userId`)
- Many-to-one with Projects (via `currentProjectId`)

### Indexes
- Index on (`userId`, `isActive`)
- Index on (`userId`, `weekStart`)

### Notes
- One record per user per week
- `isActive=true` indicates current week's context
- JSON fields for structured data while maintaining flexibility

---

## Table 5: Sessions

**Purpose**: Tracks individual work sessions for analytics and history

### Fields

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `id` | Auto number | Primary key | Yes |
| `userId` | Single line text | Links to Users.userId | Yes |
| `projectId` | Link to another record | Project worked on | No |
| `sessionStart` | Date time | When session started | Yes |
| `sessionEnd` | Date time | When session ended | No |
| `duration` | Duration | Session length (auto-calculated) | No |
| `summary` | Long text | What was accomplished | No |
| `tasksCompleted` | Long text | Tasks completed (JSON array) | No |
| `filesModified` | Long text | Files/content modified (JSON array) | No |
| `notes` | Long text | Session notes | No |
| `createdAt` | Created time | When record was created | Auto |
| `updatedAt` | Last modified time | When record was last updated | Auto |

### Relationships
- Many-to-one with Users (via `userId`)
- Many-to-one with Projects (via `projectId`)

### Indexes
- Index on (`userId`, `sessionStart`)
- Index on (`projectId`, `sessionStart`)

---

## Data Migration Strategy

### From File-Based to Airtable

**Step 1: Users Table**
- Parse CLAUDE.md
- Extract user profile, preferences, conventions
- Create single Users record

**Step 2: Projects Table**
- Parse PROJECT-REGISTRY.md
- Create one record per project
- Map status and priority fields

**Step 3: ProjectContent Table**
- For each project in `~/.claude/projects/`:
  - Read each file (README.md, PROJECT.md, STATUS.md, etc.)
  - Create ProjectContent record with appropriate contentType
  - Set isActive=true, version=1

**Step 4: WorkingContext Table**
- Parse WORKING-CONTEXT.md
- Create WorkingContext record for current week
- Set isActive=true

**Step 5: Sessions Table**
- Extract session log from WORKING-CONTEXT.md
- Create historical Session records

---

## Access Patterns

### Common Queries

**1. Load User Session**
```
GET Users WHERE userId = {currentUser}
GET WorkingContext WHERE userId = {currentUser} AND isActive = true
GET Projects WHERE userId = {currentUser} LIMIT 10
```

**2. Switch to Project**
```
GET Projects WHERE userId = {currentUser} AND projectName = {name}
GET ProjectContent WHERE projectId = {id} AND isActive = true
UPDATE WorkingContext SET currentProjectId = {id}
```

**3. Update Project Content**
```
UPDATE ProjectContent SET isActive = false WHERE projectId = {id} AND contentType = {type}
CREATE ProjectContent SET projectId={id}, contentType={type}, content={new}, isActive=true, version={n+1}
```

**4. Weekly Reset**
```
UPDATE WorkingContext SET isActive = false WHERE userId = {currentUser}
CREATE WorkingContext SET userId={currentUser}, weekStart={monday}, isActive=true
```

---

## API Considerations

### Airtable API Limits
- **Rate limit**: 5 requests per second per base
- **Record limit**: 50,000 records per base (more than sufficient)
- **Attachment limit**: 20 GB per base
- **Formula field**: Can compute derived values

### Optimization Strategies
1. **Batch operations**: Group multiple reads/writes
2. **Caching**: Cache frequently accessed data (user preferences)
3. **Lazy loading**: Load project content only when needed
4. **Pagination**: Handle large project lists efficiently

---

## Security & Privacy

### Authentication
- Use Airtable Personal Access Tokens (PAT)
- Store PAT in environment variables or secure credential store
- Never commit PAT to version control

### Data Privacy
- Data stored in Airtable cloud (US/EU regions available)
- User controls Airtable account and data
- Can export data anytime (JSON, CSV)
- Can self-host with Airtable Enterprise

### Access Control
- User-level isolation via `userId` field
- All queries filtered by authenticated user
- No cross-user data access

---

## Comparison: Files vs Airtable

### File-Based (Current)
✅ **Pros**:
- Simple, no dependencies
- Fast local access
- Complete privacy
- Git-friendly
- Human-editable

❌ **Cons**:
- Single machine only
- No cloud sync
- Manual versioning
- No collaboration
- Limited query capabilities

### Airtable-Based (Proposed)
✅ **Pros**:
- Multi-device sync
- Cloud backup
- Version history
- Query/filter capabilities
- API access
- Potential collaboration
- Visual interface

❌ **Cons**:
- Requires internet
- API rate limits
- Monthly cost (free tier available)
- Less privacy (data in cloud)
- Additional complexity

---

## Cost Estimation

### Airtable Pricing (as of 2025)

**Free Plan**:
- 1,000 records per base
- 2 GB attachments
- 2-week history
- **Cost**: $0/month

**Plus Plan**:
- 50,000 records per base
- 5 GB attachments
- 6-month history
- Sync integrations
- **Cost**: $10/user/month

**Pro Plan**:
- 100,000 records per base
- 20 GB attachments
- 1-year history
- Advanced features
- **Cost**: $20/user/month

### Estimated Usage
- **Users**: 1 record
- **Projects**: ~10-50 records
- **ProjectContent**: ~50-200 records (5-10 per project)
- **WorkingContext**: ~52 records per year (weekly)
- **Sessions**: ~200-500 records per year

**Total**: ~300-800 records per year

**Recommendation**: Free plan initially, upgrade to Plus if needed

---

## Performance Expectations

### Load Times
- **Session start**: ~1-2 seconds (API latency)
- **Project switch**: ~2-3 seconds (fetch content)
- **Update operation**: ~500ms-1s (single write)

### Comparison with File-Based
- **File-based**: ~1 second (instant local read)
- **Airtable**: ~1-2 seconds (network + API)

**Acceptable**: ~1 second slower, but gains cloud sync

---

## Implementation Phases

### Phase 1: Core Schema (Week 1)
- Create Airtable base
- Set up tables and fields
- Configure relationships

### Phase 2: SDK Development (Week 2)
- TypeScript client library
- CRUD operations
- Error handling
- Retry logic

### Phase 3: Migration Tools (Week 3)
- File-to-Airtable migration script
- Validation tools
- Rollback capability

### Phase 4: Testing & Documentation (Week 4)
- Unit tests
- Integration tests
- User documentation
- API reference

---

## Table 6: PromptingRules (NEW in v2.1)

**Purpose**: Stores natural language command rules and behavioral preferences for intelligent command interpretation

### Fields

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `id` | Auto number | Primary key | Yes |
| `userId` | Single line text | Links to Users.userId | Yes |
| `ruleType` | Single select | COMMAND, BEHAVIOR, PREFERENCE, WORKFLOW | Yes |
| `category` | Single line text | Grouping (e.g., "navigation", "execution") | No |
| `trigger` | Single line text | What activates this rule (e.g., "Go", "Done") | Yes |
| `contextPatterns` | Long text | When this applies (JSON array of patterns) | No |
| `action` | Long text | What to do (JSON object describing action) | Yes |
| `priority` | Number | Rule priority (higher = first) | Yes |
| `isActive` | Checkbox | Whether rule is enabled | Yes |
| `description` | Long text | Human-readable explanation | No |
| `examples` | Long text | Usage examples (JSON array) | No |
| `createdAt` | Created time | When record was created | Auto |
| `updatedAt` | Last modified time | When record was last updated | Auto |

### Relationships
- Many-to-one with Users (via `userId`)

### Indexes
- Index on (`userId`, `trigger`, `isActive`)
- Index on (`userId`, `ruleType`)

### Rule Types

**COMMAND**: Shorthand command definitions
- Maps natural language like "Go" to contextual actions
- Example: "Go" when ready → execute next step
- Example: "Go" when blocked → explain why blocked

**BEHAVIOR**: How Claude should act in certain situations
- Defines behavioral patterns
- Example: When task completes → show summary
- Example: When unclear → ask clarifying questions

**PREFERENCE**: User communication preferences
- Verbosity level, emoji usage, error detail
- Applied globally to all interactions
- Example: prefer concise responses

**WORKFLOW**: Task-specific automation
- Automated steps for common workflows
- Example: On code change → lint, test, commit
- Example: On PR creation → run checks, notify

### Example Records

**Command Rule - "Go" when ready:**
```json
{
  "userId": "user@example.com",
  "ruleType": "COMMAND",
  "trigger": "Go",
  "contextPatterns": [{"type": "task_state", "value": "ready_to_proceed"}],
  "action": {
    "type": "contextual_execution",
    "handlers": {
      "ready_to_proceed": {
        "response": "execute_next_logical_step",
        "show_progress": true
      }
    }
  },
  "priority": 100,
  "isActive": true,
  "description": "Execute next step when ready"
}
```

**Preference Rule - Communication style:**
```json
{
  "userId": "user@example.com",
  "ruleType": "PREFERENCE",
  "category": "communication",
  "trigger": "always",
  "action": {
    "type": "preference",
    "settings": {
      "verbosity": "concise",
      "use_emojis": false,
      "error_detail_level": "full",
      "proactive_suggestions": true
    }
  },
  "priority": 50,
  "isActive": true,
  "description": "Default communication preferences"
}
```

### Default Rules

The system automatically creates these default rules for new users:

1. **Go (ready)** - Execute next step when ready to proceed
2. **Go (blocked)** - Explain blocking reason when blocked
3. **Done** - Acknowledge task completion
4. **Communication Preferences** - Default to concise, detailed errors, proactive

---

## Next Steps

1. **Review**: User reviews this schema design
2. **Approve**: User approves or requests changes
3. **Create**: Set up Airtable base with this schema
4. **Develop**: Build TypeScript SDK
5. **Migrate**: Migrate existing data from files
6. **Test**: Validate functionality
7. **Deploy**: Switch to Airtable backend

---

## Questions to Resolve

- [ ] Do you have an Airtable account already?
- [ ] Which Airtable plan do you want to use?
- [ ] Do you want to support multiple users initially, or single user?
- [ ] Should we maintain file-based backup alongside Airtable?
- [ ] Do you want offline support (cached mode)?

---

**Status**: Design Complete - Awaiting Review ✅
**Next**: Create Airtable base or adjust schema based on feedback
