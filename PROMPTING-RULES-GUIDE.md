# Prompting Rules System - User Guide

**Intelligent Natural Language Command Parsing for Claude Code**

**Version**: 2.1.0
**Created**: 2025-11-03

---

## What is This?

The Prompting Rules System enables Claude to automatically understand and interpret your natural language commands based on context. Instead of Claude asking "what do you mean by 'Go'?", it knows what to do based on the current situation.

### Key Features

✅ **Context-Aware Commands** - "Go" means different things in different situations
✅ **Shorthand Support** - Type less, accomplish more
✅ **Behavioral Rules** - Define how Claude should act
✅ **User Preferences** - Set communication style once, apply everywhere
✅ **Workflow Automation** - Automate common task sequences

---

## Quick Start

### 1. Set Up Airtable Table

Add the **PromptingRules** table to your Airtable base. See `AIRTABLE-SCHEMA.md` for the complete schema.

**Quick setup:**
- Table name: `PromptingRules`
- 13 fields (see schema document)
- Relationships: Links to Users table

### 2. Initialize Session

```typescript
import { MemoryClient, getConfig } from '@claude/persistent-memory';

const client = new MemoryClient(getConfig());

// Initialize session with rules
await client.initializeSession();
```

### 3. Use Natural Language Commands

```typescript
// Process commands contextually
const result = await client.processCommand('Go');

if (result.success) {
  console.log(result.response);
} else {
  console.error(result.error);
}
```

That's it! The system automatically creates default rules on first use.

---

## How It Works

### The Flow

```
User types: "Go"
    ↓
CommandParser identifies trigger
    ↓
ContextEngine collects current context
    ↓
RuleMatching finds best rule for context
    ↓
ActionExecutor runs the rule's action
    ↓
Response returned to user
```

### Context Detection

The system automatically detects:
- **Task State** - ready, blocked, waiting, in_progress, completed
- **Activity Type** - coding, documenting, debugging, researching
- **File Context** - what files are being worked on
- **Git Status** - branch, uncommitted changes, pending push
- **Todo List** - active and completed tasks
- **Session Info** - duration, recent commands

---

## Default Commands

These commands work out of the box:

### "Go"

**Context: Ready to proceed**
- **Action**: Execute the next logical step
- **Example**: After planning, "Go" starts implementation

**Context: Blocked**
- **Action**: Explain why blocked and what's needed
- **Example**: When waiting for PR creation, explains manual step required

**Context: Completed**
- **Action**: Acknowledge completion and suggest next steps

### "Done"

- **Action**: Acknowledge that user completed a manual step
- **Shows**: Summary of what was accomplished

---

## Creating Custom Rules

### Via Airtable UI

1. Open your **PromptingRules** table
2. Add a new record
3. Fill in the fields:
   - `userId`: Your user ID
   - `ruleType`: COMMAND, BEHAVIOR, PREFERENCE, or WORKFLOW
   - `trigger`: The command word (e.g., "ship")
   - `action`: JSON describing what to do
   - `priority`: Higher number = higher priority
   - `isActive`: Check to enable

### Via SDK

```typescript
import { RulesClient, getConfig } from '@claude/persistent-memory';

const rulesClient = new RulesClient(getConfig());

await rulesClient.createRule({
  userId: 'your@email.com',
  ruleType: 'COMMAND',
  trigger: 'ship',
  action: {
    type: 'macro',
    steps: [
      'run_tests',
      'build_production',
      'commit_changes',
      'push_to_main',
      'create_release_tag'
    ]
  },
  priority: 90,
  isActive: true,
  description: 'Ship code to production'
});
```

---

## Rule Types

### 1. COMMAND Rules

Map shorthand to actions.

**Example - Custom "ship" command:**
```json
{
  "trigger": "ship",
  "action": {
    "type": "macro",
    "steps": ["test", "build", "commit", "push"]
  }
}
```

**Use case**: Replace multi-step processes with one word.

### 2. BEHAVIOR Rules

Define how Claude acts in situations.

**Example - On task completion:**
```json
{
  "trigger": "on_task_complete",
  "action": {
    "type": "behavior",
    "steps": [
      "mark_todo_complete",
      "show_summary",
      "suggest_next_steps"
    ],
    "options": {
      "verbosity": "concise"
    }
  }
}
```

**Use case**: Standardize Claude's behavior patterns.

### 3. PREFERENCE Rules

Set global preferences once.

**Example - Communication style:**
```json
{
  "trigger": "always",
  "action": {
    "type": "preference",
    "settings": {
      "verbosity": "concise",
      "use_emojis": false,
      "error_detail_level": "full",
      "proactive_suggestions": true
    }
  }
}
```

**Use case**: Configure how Claude communicates.

### 4. WORKFLOW Rules

Automate task sequences.

**Example - On code change:**
```json
{
  "trigger": "on_code_change",
  "contextPatterns": [
    {"type": "file_type", "value": "*.ts"}
  ],
  "action": {
    "type": "workflow",
    "steps": [
      "run_linter",
      "check_types",
      "run_tests",
      "commit_if_passing"
    ]
  }
}
```

**Use case**: Automate repetitive workflows.

---

## Context Patterns

Refine when rules apply using context patterns.

### Task State Pattern

```json
{
  "contextPatterns": [
    {"type": "task_state", "value": "blocked"}
  ]
}
```

Matches when task state is "blocked".

### Activity Pattern

```json
{
  "contextPatterns": [
    {"type": "activity", "value": "coding"}
  ]
}
```

Matches when current activity is "coding".

### File Type Pattern

```json
{
  "contextPatterns": [
    {"type": "file_type", "value": "*.ts"}
  ]
}
```

Matches when working on TypeScript files.

### Multiple Patterns

All patterns must match:

```json
{
  "contextPatterns": [
    {"type": "task_state", "value": "ready_to_proceed"},
    {"type": "activity", "value": "coding"}
  ]
}
```

---

## Advanced Usage

### Priority System

When multiple rules match, the highest priority wins.

**Recommendation:**
- Default rules: 50-100
- User commands: 80-95
- Override rules: 95-100

### Rule Activation/Deactivation

Toggle rules without deleting:

```typescript
await rulesClient.updateRule(ruleId, {
  isActive: false
});
```

### Refreshing Rules

Reload rules from Airtable:

```typescript
await client.refreshRules();
```

Useful after editing rules in Airtable UI.

### Manual Context Updates

Update context programmatically:

```typescript
// Update todo list
client.updateTodoContext(todos);

// Set task state
client.setTaskState('blocked');
```

---

## Integration Examples

### With Todo System

```typescript
import { TodoWrite } from './todo-system';

async function handleCommand(input: string) {
  const result = await client.processCommand(input);

  // Update todos based on result
  if (result.metadata?.showProgress) {
    await TodoWrite({ todos: updatedTodos });
  }

  return result.response;
}
```

### With Git Operations

```typescript
async function handleGitCommand(input: string) {
  // Set context
  client.setActivity('coding');

  // Process command
  const result = await client.processCommand(input);

  // Execute git operations if needed
  if (result.actions?.includes('commit_changes')) {
    await gitCommit();
  }
}
```

---

## Best Practices

### DO:

✅ Create specific, well-named triggers
✅ Use context patterns to avoid conflicts
✅ Set appropriate priorities
✅ Test rules with different contexts
✅ Document complex rules in `description` field
✅ Use examples field for clarity

### DON'T:

❌ Create overlapping rules without context patterns
❌ Use generic triggers without context
❌ Set all rules to priority 100
❌ Forget to set `isActive` to true
❌ Hardcode user-specific values in shared rules

---

## Troubleshooting

### "Unknown command" Error

**Cause**: No matching rule found.

**Solution**:
1. Check rule exists in Airtable
2. Verify `isActive` is true
3. Check `trigger` matches exactly
4. Verify context patterns match current context

### Rules Not Loading

**Cause**: Session not initialized.

**Solution**:
```typescript
await client.initializeSession();
```

### Wrong Rule Matching

**Cause**: Priority or context pattern issue.

**Solution**:
1. Check rule priorities
2. Verify context patterns are specific enough
3. Use `getSessionContext()` to inspect context

### Rules Not Updating

**Cause**: Cached rules.

**Solution**:
```typescript
await client.refreshRules();
```

---

## Performance

### Caching

Rules are cached per session:
- **Cache Duration**: Entire session
- **Invalidation**: Manual via `refreshRules()`
- **Size**: Minimal (typically < 100 rules)

### Context Collection

Context collected on-demand:
- **Frequency**: Per command
- **Cache TTL**: 30 seconds (configurable)
- **Cost**: Minimal (git operations cached)

---

## Examples

### Simple Command

```typescript
// Create a "status" command
await rulesClient.createRule({
  userId: config.userId,
  ruleType: 'COMMAND',
  trigger: 'status',
  action: {
    type: 'contextual_execution',
    handlers: {
      default: {
        response: 'show_current_status',
        show_progress: true
      }
    }
  },
  priority: 85,
  isActive: true
});

// Use it
const result = await client.processCommand('status');
```

### Conditional Command

```typescript
// "Go" behaves differently when blocked
await rulesClient.createRule({
  userId: config.userId,
  ruleType: 'COMMAND',
  trigger: 'Go',
  contextPatterns: [
    {type: 'task_state', value: 'blocked'}
  ],
  action: {
    type: 'contextual_execution',
    handlers: {
      blocked: {
        response: 'explain_blocking_reason',
        details: 'explain_what_user_must_do'
      }
    }
  },
  priority: 95,
  isActive: true
});
```

### Workflow Automation

```typescript
// Auto-commit on successful tests
await rulesClient.createRule({
  userId: config.userId,
  ruleType: 'WORKFLOW',
  trigger: 'on_tests_pass',
  action: {
    type: 'workflow',
    steps: [
      'stage_all_changes',
      'commit_with_message',
      'push_to_remote'
    ],
    options: {
      auto_commit: true,
      commit_message_style: 'conventional'
    }
  },
  priority: 60,
  isActive: true
});
```

---

## Summary

The Prompting Rules System makes Claude understand your natural language commands contextually. With minimal setup, you get:

- Intelligent command interpretation
- Context-aware responses
- Customizable behaviors
- Workflow automation

**Setup time**: 5 minutes
**Learning curve**: Low
**Power**: High

---

## Next Steps

1. **Set up PromptingRules table** in Airtable
2. **Initialize session** in your code
3. **Try default commands** ("Go", "Done")
4. **Create custom rules** for your workflow
5. **Iterate and refine** based on usage

---

## Resources

- **Schema**: `AIRTABLE-SCHEMA.md` (Table 6)
- **Technical Design**: `PROMPTING-RULES-SCHEMA.md`
- **Examples**: `examples/prompting-rules-usage.ts`
- **API Reference**: See type definitions in `src/types/prompting-rules.ts`

---

**Version**: 2.1.0
**Status**: Production Ready ✅
**Created**: 2025-11-03
