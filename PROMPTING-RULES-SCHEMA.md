# Prompting Rules System - Schema Design

**Automatic Natural Language Parsing & Context-Aware Command Interpretation**

**Version**: 2.1
**Created**: 2025-11-03

---

## Overview

This system extends the persistent memory with intelligent natural language parsing, allowing Claude to automatically understand and apply user-specific communication patterns, shorthand commands, and behavioral preferences.

---

## Problem Statement

**Current State:**
- User preferences stored but not actively applied
- No understanding of shorthand commands ("Go", "Done", etc.)
- No contextual command interpretation
- Manual explanation required for each command

**Desired State:**
- Automatic loading of user's prompting rules
- Context-aware interpretation of shorthand
- Behavioral preferences applied automatically
- Natural conversation flow without repetition

---

## Architecture

### New Airtable Table: PromptingRules

**Purpose**: Store user-specific communication patterns and command definitions

### New SDK Components:
1. **CommandParser** - Interprets shorthand commands
2. **ContextEngine** - Applies contextual rules
3. **SessionInitializer** - Loads rules at startup
4. **RulesRegistry** - Manages rule definitions

---

## Airtable Schema: PromptingRules Table

### Fields

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `id` | Auto number | Primary key | Yes |
| `userId` | Single line text | Links to Users.userId | Yes |
| `ruleType` | Single select | COMMAND, BEHAVIOR, PREFERENCE, WORKFLOW | Yes |
| `category` | Single line text | Grouping (e.g., "navigation", "execution") | No |
| `trigger` | Single line text | What activates this rule (e.g., "Go") | Yes |
| `contextPatterns` | Long text | When this applies (JSON array) | No |
| `action` | Long text | What to do (JSON object) | Yes |
| `priority` | Number | Rule priority (higher = first) | Yes |
| `isActive` | Checkbox | Whether rule is enabled | Yes |
| `description` | Long text | Human-readable explanation | No |
| `examples` | Long text | Usage examples (JSON array) | No |
| `createdAt` | Created time | When created | Auto |
| `updatedAt` | Last modified time | When updated | Auto |

### Rule Types

**COMMAND**: Shorthand command definitions
- "Go" → "Execute next step"
- "Done" → "I've completed the action"
- "Continue" → "Resume previous task"

**BEHAVIOR**: How Claude should act
- When blocked → Explain and wait
- When complete → Show summary
- When unclear → Ask questions

**PREFERENCE**: User preferences
- Verbosity level (concise/detailed)
- Proactivity (high/medium/low)
- Error handling style

**WORKFLOW**: Task-specific behaviors
- During development → Commit frequently
- During research → Provide sources
- During debugging → Show full context

---

## Rule Structure (JSON Schemas)

### Command Rule

```json
{
  "ruleType": "COMMAND",
  "trigger": "Go",
  "contextPatterns": [
    {"type": "task_state", "value": "blocked"},
    {"type": "task_state", "value": "waiting_for_user"},
    {"type": "task_state", "value": "ready_to_proceed"}
  ],
  "action": {
    "type": "contextual_execution",
    "handlers": {
      "blocked": {
        "response": "explain_blocking_reason",
        "then": "wait_for_user_action"
      },
      "waiting_for_user": {
        "response": "cannot_proceed_user_action_required",
        "details": "explain_what_user_must_do"
      },
      "ready_to_proceed": {
        "response": "execute_next_logical_step",
        "show_progress": true
      },
      "completed": {
        "response": "acknowledge_already_complete",
        "show_summary": true
      }
    }
  },
  "priority": 100,
  "isActive": true,
  "description": "Contextually execute next step or explain why blocked",
  "examples": [
    {
      "input": "Go",
      "context": "PR created, ready to merge",
      "output": "Merge the PR and proceed with next steps"
    },
    {
      "input": "Go",
      "context": "Blocked waiting for user to create PR",
      "output": "I cannot create the PR. You must do this manually at [URL]"
    }
  ]
}
```

### Behavior Rule

```json
{
  "ruleType": "BEHAVIOR",
  "trigger": "on_task_complete",
  "contextPatterns": [
    {"type": "event", "value": "task_completed"}
  ],
  "action": {
    "type": "behavior",
    "steps": [
      "mark_todo_complete",
      "show_completion_summary",
      "suggest_next_steps",
      "update_working_context"
    ],
    "options": {
      "verbosity": "concise",
      "include_stats": true,
      "show_related_tasks": true
    }
  },
  "priority": 80,
  "isActive": true,
  "description": "What to do when a task completes"
}
```

### Preference Rule

```json
{
  "ruleType": "PREFERENCE",
  "category": "communication",
  "trigger": "always",
  "action": {
    "type": "preference",
    "settings": {
      "verbosity": "concise",
      "use_emojis": false,
      "code_comments": "minimal",
      "error_detail_level": "full",
      "proactive_suggestions": true,
      "confirm_destructive_actions": true
    }
  },
  "priority": 50,
  "isActive": true,
  "description": "General communication preferences"
}
```

### Workflow Rule

```json
{
  "ruleType": "WORKFLOW",
  "category": "development",
  "trigger": "on_code_change",
  "contextPatterns": [
    {"type": "activity", "value": "coding"},
    {"type": "file_type", "value": "*.ts"}
  ],
  "action": {
    "type": "workflow",
    "steps": [
      "run_linter",
      "check_types",
      "run_relevant_tests",
      "commit_if_passing"
    ],
    "options": {
      "auto_commit": false,
      "commit_message_style": "conventional",
      "push_on_commit": true
    }
  },
  "priority": 60,
  "isActive": true,
  "description": "Development workflow automation"
}
```

---

## Context Detection

### Context Types

**Task State:**
- `ready_to_proceed` - Can execute next step
- `blocked` - Waiting on external dependency
- `waiting_for_user` - User action required
- `in_progress` - Currently executing
- `completed` - Task finished

**Activity Type:**
- `coding` - Writing code
- `documenting` - Writing docs
- `debugging` - Fixing issues
- `researching` - Gathering info
- `reviewing` - Code review

**File Context:**
- File types being worked on
- Project location
- Git status

**Session Context:**
- Time in session
- Recent commands
- Todo list state

---

## Command Registry

### Default Commands

| Command | Context | Interpretation | Action |
|---------|---------|----------------|--------|
| **Go** | Ready | "Execute next step" | Proceed with task |
| **Go** | Blocked | "Try to proceed" | Explain blocking reason |
| **Go** | Complete | "What's next?" | Show summary and options |
| **Done** | In progress | "I finished" | Mark complete, verify |
| **Done** | Waiting | "I completed the manual step" | Acknowledge and proceed |
| **Continue** | Paused | "Resume task" | Continue from last point |
| **Stop** | Any | "Halt execution" | Stop current task |
| **Status** | Any | "Show progress" | Display current state |
| **Why** | Blocked | "Explain blocker" | Detail explanation |
| **Skip** | Current task | "Skip this step" | Move to next task |

### Custom Commands

Users can define custom shorthand:

```json
{
  "trigger": "ship",
  "action": {
    "type": "macro",
    "steps": [
      "run_tests",
      "build_production",
      "commit_changes",
      "push_to_main",
      "create_release_tag"
    ]
  }
}
```

---

## Parser Architecture

### 1. Input Processing Pipeline

```
User Input
    ↓
Tokenizer (split into tokens)
    ↓
Context Collector (gather current context)
    ↓
Rule Matcher (find matching rules)
    ↓
Priority Resolver (select best rule)
    ↓
Action Executor (execute rule action)
    ↓
Response Generator (format output)
```

### 2. Context Collection

Collects current state:
- Todo list status
- Git status
- Recent actions
- Time in session
- Active files
- Current project

### 3. Rule Matching

Finds applicable rules:
- Exact trigger match
- Context pattern match
- Priority sorting
- Active rules only

### 4. Action Execution

Executes matched action:
- Runs action steps
- Applies preferences
- Updates context
- Generates response

---

## Integration Points

### 1. Session Initialization

```typescript
class SessionInitializer {
  async initialize(userId: string): Promise<SessionContext> {
    // Load user preferences
    const user = await memoryClient.getPreferences();

    // Load prompting rules
    const rules = await rulesClient.loadRules(userId);

    // Build context
    const context = {
      user,
      rules,
      commandRegistry: new CommandRegistry(rules),
      parser: new CommandParser(rules),
      engine: new ContextEngine(rules)
    };

    return context;
  }
}
```

### 2. Input Processing

```typescript
class InputProcessor {
  async process(input: string, context: SessionContext): Promise<Response> {
    // Parse input
    const parsed = await context.parser.parse(input);

    // Collect context
    const currentContext = await context.engine.collectContext();

    // Match rules
    const matchedRule = await context.engine.matchRule(parsed, currentContext);

    // Execute action
    const result = await context.engine.executeAction(matchedRule);

    return result;
  }
}
```

### 3. MemoryClient Integration

```typescript
class MemoryClient {
  private sessionContext?: SessionContext;

  async initializeSession(): Promise<void> {
    const initializer = new SessionInitializer(this.config);
    this.sessionContext = await initializer.initialize(this.config.userId);
  }

  async processCommand(input: string): Promise<any> {
    if (!this.sessionContext) {
      await this.initializeSession();
    }

    const processor = new InputProcessor();
    return processor.process(input, this.sessionContext!);
  }
}
```

---

## Use Cases

### Use Case 1: "Go" Command

**Scenario**: User types "Go"

**Context**: PR created, waiting for user to create it on GitHub

**Processing**:
1. Parser identifies "Go" command
2. Context collector finds: task=create_pr, state=blocked_waiting_user
3. Rule matcher finds COMMAND rule for "Go" with context "blocked"
4. Action executor runs "explain_blocking_reason"
5. Response: "I cannot create the PR. GitHub CLI not available. You must..."

---

### Use Case 2: Behavioral Preference

**Scenario**: Task completes

**Context**: User preference is "concise" communication

**Processing**:
1. Event: task_completed
2. Rule matcher finds BEHAVIOR rule for "on_task_complete"
3. Checks PREFERENCE rule for verbosity
4. Action executor shows brief summary (not detailed)
5. Response: "✅ Complete. 3 files changed. Ready for next task."

---

### Use Case 3: Workflow Automation

**Scenario**: Code changes detected

**Context**: TypeScript files modified, workflow rule active

**Processing**:
1. Event: files_changed
2. Rule matcher finds WORKFLOW rule for development
3. Action executor runs: lint → typecheck → test
4. Auto-commit if configured
5. Response: "Code validated and committed."

---

## Example Rules Set

### For a Developer User

```json
[
  {
    "trigger": "Go",
    "contextPatterns": [{"type": "task_state", "value": "ready"}],
    "action": {"type": "execute_next"},
    "priority": 100
  },
  {
    "trigger": "ship",
    "action": {"type": "macro", "steps": ["test", "build", "commit", "push"]},
    "priority": 90
  },
  {
    "trigger": "on_task_complete",
    "action": {"type": "behavior", "steps": ["update_todos", "show_summary"]},
    "priority": 80
  },
  {
    "category": "communication",
    "action": {"type": "preference", "settings": {"verbosity": "concise"}},
    "priority": 50
  }
]
```

---

## Performance Considerations

### Caching Strategy
- Cache rules per session (no re-fetch)
- Cache context for 30 seconds
- Invalidate on state changes

### Rule Matching Optimization
- Index rules by trigger
- Pre-filter by active status
- Sort by priority once

### Context Collection Optimization
- Lazy loading of context data
- Only collect what's needed for matched rules
- Cache expensive operations (git status)

---

## Security & Privacy

**Rule Validation**:
- Validate action types
- Prevent malicious actions
- Sanitize user input

**Access Control**:
- Rules scoped to user
- No cross-user rule access
- Admin-only system rules

**Audit Logging**:
- Log rule executions
- Track command usage
- Monitor for abuse

---

## Migration Path

### Phase 1: Core Infrastructure
- PromptingRules table
- Basic parser
- Simple command registry

### Phase 2: Context Engine
- Context collection
- Rule matching
- Action execution

### Phase 3: Advanced Features
- Macro commands
- Workflow automation
- Learning from usage

### Phase 4: UI/UX
- Visual rule editor
- Rule testing interface
- Usage analytics

---

## API Design

### Load Rules

```typescript
interface RulesClient {
  loadRules(userId: string): Promise<PromptingRule[]>;
  createRule(rule: PromptingRuleCreate): Promise<PromptingRule>;
  updateRule(id: number, updates: Partial<PromptingRule>): Promise<PromptingRule>;
  deleteRule(id: number): Promise<void>;
}
```

### Parse Commands

```typescript
interface CommandParser {
  parse(input: string): Promise<ParsedCommand>;
  matchRules(parsed: ParsedCommand, context: Context): Promise<PromptingRule[]>;
  executeRule(rule: PromptingRule, context: Context): Promise<ActionResult>;
}
```

### Context Engine

```typescript
interface ContextEngine {
  collectContext(): Promise<Context>;
  applyRules(context: Context): Promise<void>;
  updateContext(changes: Partial<Context>): Promise<void>;
}
```

---

## Testing Strategy

**Unit Tests**:
- Parser token matching
- Rule matching logic
- Context collection
- Action execution

**Integration Tests**:
- Full command processing
- Multiple rule interactions
- Context updates
- Error handling

**User Acceptance Tests**:
- Common command scenarios
- Edge cases
- Performance benchmarks

---

## Documentation

**For Users**:
- Prompting rules guide
- Common commands
- Custom rule creation
- Examples and templates

**For Developers**:
- API reference
- Parser internals
- Extending the system
- Best practices

---

## Success Metrics

**Efficiency**:
- Reduced command repetition
- Faster task completion
- Fewer clarifications needed

**Accuracy**:
- Correct command interpretation
- Appropriate context detection
- Proper rule application

**User Satisfaction**:
- Natural conversation flow
- Predictable behavior
- Easy customization

---

## Next Steps

1. Implement PromptingRules table in Airtable
2. Build CommandParser SDK
3. Create ContextEngine
4. Integrate with MemoryClient
5. Add default rule set
6. Test with real scenarios
7. Document usage
8. Deploy and iterate

---

**Status**: Design Complete - Ready for Implementation
**Version**: 2.1.0
**Created**: 2025-11-03
