/**
 * Type definitions for Prompting Rules System
 */

// ============================================================================
// Rule Types
// ============================================================================

export type RuleType = 'COMMAND' | 'BEHAVIOR' | 'PREFERENCE' | 'WORKFLOW';

export type TaskState =
  | 'ready_to_proceed'
  | 'blocked'
  | 'waiting_for_user'
  | 'in_progress'
  | 'completed'
  | 'paused';

export type ActivityType =
  | 'coding'
  | 'documenting'
  | 'debugging'
  | 'researching'
  | 'reviewing'
  | 'testing';

// ============================================================================
// Context Pattern
// ============================================================================

export interface ContextPattern {
  type: 'task_state' | 'activity' | 'file_type' | 'event' | 'custom';
  value: string;
  operator?: 'equals' | 'contains' | 'matches' | 'not_equals';
}

// ============================================================================
// Rule Actions
// ============================================================================

export interface CommandAction {
  type: 'contextual_execution';
  handlers: {
    [state: string]: {
      response: string;
      then?: string;
      details?: string;
      show_progress?: boolean;
      show_summary?: boolean;
    };
  };
}

export interface BehaviorAction {
  type: 'behavior';
  steps: string[];
  options?: {
    verbosity?: 'concise' | 'detailed';
    include_stats?: boolean;
    show_related_tasks?: boolean;
    [key: string]: any;
  };
}

export interface PreferenceAction {
  type: 'preference';
  settings: {
    verbosity?: 'concise' | 'detailed';
    use_emojis?: boolean;
    code_comments?: 'minimal' | 'moderate' | 'detailed';
    error_detail_level?: 'brief' | 'full';
    proactive_suggestions?: boolean;
    confirm_destructive_actions?: boolean;
    [key: string]: any;
  };
}

export interface WorkflowAction {
  type: 'workflow';
  steps: string[];
  options?: {
    auto_commit?: boolean;
    commit_message_style?: 'conventional' | 'simple' | 'detailed';
    push_on_commit?: boolean;
    [key: string]: any;
  };
}

export interface MacroAction {
  type: 'macro';
  steps: string[];
  options?: Record<string, any>;
}

export type RuleAction =
  | CommandAction
  | BehaviorAction
  | PreferenceAction
  | WorkflowAction
  | MacroAction;

// ============================================================================
// Prompting Rule
// ============================================================================

export interface PromptingRule {
  id?: number;
  userId: string;
  ruleType: RuleType;
  category?: string;
  trigger: string;
  contextPatterns?: ContextPattern[];
  action: RuleAction;
  priority: number;
  isActive: boolean;
  description?: string;
  examples?: RuleExample[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RuleExample {
  input: string;
  context: string;
  output: string;
}

export interface PromptingRuleCreate extends Omit<PromptingRule, 'id' | 'createdAt' | 'updatedAt'> {}

export interface PromptingRuleUpdate extends Partial<PromptingRuleCreate> {}

// ============================================================================
// Parsed Command
// ============================================================================

export interface ParsedCommand {
  raw: string;
  trigger: string;
  tokens: string[];
  arguments?: string[];
  isShorthand: boolean;
}

// ============================================================================
// Context
// ============================================================================

export interface Context {
  // Task context
  taskState: TaskState;
  currentActivity?: ActivityType;
  todoList?: any[];
  activeTodos?: any[];
  completedTodos?: any[];

  // File context
  workingDirectory?: string;
  activeFiles?: string[];
  recentFiles?: string[];
  fileTypes?: string[];

  // Git context
  gitBranch?: string;
  gitStatus?: string;
  hasUncommittedChanges?: boolean;
  hasPendingPush?: boolean;

  // Session context
  sessionStartTime?: Date;
  sessionDuration?: number;
  recentCommands?: string[];
  lastCommand?: string;
  commandHistory?: string[];

  // Project context
  currentProject?: string;
  activeProjects?: string[];

  // User preferences (from rules)
  preferences?: PreferenceAction['settings'];

  // Custom context
  [key: string]: any;
}

// ============================================================================
// Action Result
// ============================================================================

export interface ActionResult {
  success: boolean;
  response?: string;
  actions?: string[];
  nextSteps?: string[];
  error?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Session Context
// ============================================================================

export interface SessionContext {
  userId: string;
  rules: PromptingRule[];
  context: Context;
  commandRegistry: Map<string, PromptingRule>;
  preferences: PreferenceAction['settings'];
}

// ============================================================================
// Parser Options
// ============================================================================

export interface ParserOptions {
  enableContextCollection?: boolean;
  enableRuleMatching?: boolean;
  enableActionExecution?: boolean;
  cacheContext?: boolean;
  contextCacheTTL?: number; // in seconds
}

// ============================================================================
// Rule Query
// ============================================================================

export interface RuleQuery {
  userId: string;
  ruleType?: RuleType | RuleType[];
  category?: string;
  trigger?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}
