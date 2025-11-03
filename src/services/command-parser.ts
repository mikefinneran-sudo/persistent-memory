/**
 * Command Parser - Natural Language Command Interpretation
 */

import {
  ParsedCommand,
  PromptingRule,
  Context,
  ActionResult,
  RuleAction,
  CommandAction,
  BehaviorAction,
  MacroAction,
} from '../types/prompting-rules';

export class CommandParser {
  private rules: PromptingRule[];
  private commandMap: Map<string, PromptingRule[]>;

  constructor(rules: PromptingRule[]) {
    this.rules = rules.filter((r) => r.isActive).sort((a, b) => b.priority - a.priority);
    this.commandMap = this.buildCommandMap();
  }

  /**
   * Builds a map of triggers to rules for fast lookup
   */
  private buildCommandMap(): Map<string, PromptingRule[]> {
    const map = new Map<string, PromptingRule[]>();

    for (const rule of this.rules) {
      const trigger = rule.trigger.toLowerCase();
      const existing = map.get(trigger) || [];
      existing.push(rule);
      map.set(trigger, existing);
    }

    return map;
  }

  /**
   * Parses user input into a structured command
   */
  parse(input: string): ParsedCommand {
    const trimmed = input.trim();
    const tokens = trimmed.split(/\s+/);
    const trigger = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    // Check if this is a known shorthand command
    const isShorthand = this.commandMap.has(trigger);

    return {
      raw: input,
      trigger,
      tokens,
      arguments: args.length > 0 ? args : undefined,
      isShorthand,
    };
  }

  /**
   * Matches rules based on parsed command and context
   */
  matchRules(parsed: ParsedCommand, context: Context): PromptingRule[] {
    // Get rules for this trigger
    const candidateRules = this.commandMap.get(parsed.trigger) || [];

    if (candidateRules.length === 0) {
      return [];
    }

    // Filter by context patterns
    const matchedRules = candidateRules.filter((rule) => {
      if (!rule.contextPatterns || rule.contextPatterns.length === 0) {
        return true; // No context requirements, always matches
      }

      // All context patterns must match
      return rule.contextPatterns.every((pattern) =>
        this.matchesContextPattern(pattern, context)
      );
    });

    // Sort by priority (already sorted, but just in case)
    return matchedRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Checks if a context pattern matches the current context
   */
  private matchesContextPattern(
    pattern: PromptingRule['contextPatterns'][0],
    context: Context
  ): boolean {
    const operator = pattern.operator || 'equals';

    switch (pattern.type) {
      case 'task_state':
        return this.compareValues(context.taskState, pattern.value, operator);

      case 'activity':
        return this.compareValues(context.currentActivity, pattern.value, operator);

      case 'file_type':
        if (!context.fileTypes) return false;
        return context.fileTypes.some((ft) =>
          this.compareValues(ft, pattern.value, operator)
        );

      case 'event':
        // Events are typically passed in context as flags
        return this.compareValues(context[pattern.value], 'true', operator);

      case 'custom':
        // Custom pattern matching
        return this.compareValues(context[pattern.type], pattern.value, operator);

      default:
        return false;
    }
  }

  /**
   * Compares values based on operator
   */
  private compareValues(
    actual: any,
    expected: string,
    operator: string
  ): boolean {
    const actualStr = String(actual || '').toLowerCase();
    const expectedStr = expected.toLowerCase();

    switch (operator) {
      case 'equals':
        return actualStr === expectedStr;

      case 'contains':
        return actualStr.includes(expectedStr);

      case 'matches':
        try {
          const regex = new RegExp(expectedStr);
          return regex.test(actualStr);
        } catch {
          return false;
        }

      case 'not_equals':
        return actualStr !== expectedStr;

      default:
        return false;
    }
  }

  /**
   * Executes a rule's action
   */
  async executeAction(rule: PromptingRule, context: Context): Promise<ActionResult> {
    try {
      switch (rule.action.type) {
        case 'contextual_execution':
          return this.executeCommandAction(rule.action as CommandAction, context);

        case 'behavior':
          return this.executeBehaviorAction(rule.action as BehaviorAction, context);

        case 'macro':
          return this.executeMacroAction(rule.action as MacroAction, context);

        case 'preference':
          // Preferences are applied to context, not executed
          return {
            success: true,
            response: 'Preferences applied',
          };

        case 'workflow':
          // Workflows need to be implemented by the caller
          return {
            success: true,
            response: 'Workflow triggered',
            actions: rule.action.steps,
          };

        default:
          return {
            success: false,
            error: `Unknown action type: ${rule.action.type}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Executes a command action (contextual)
   */
  private executeCommandAction(
    action: CommandAction,
    context: Context
  ): ActionResult {
    const taskState = context.taskState || 'ready_to_proceed';
    const handler = action.handlers[taskState];

    if (!handler) {
      return {
        success: false,
        error: `No handler for task state: ${taskState}`,
      };
    }

    // Generate response based on handler
    let response = this.generateResponse(handler.response, context);

    if (handler.details) {
      response += '\n\n' + this.generateResponse(handler.details, context);
    }

    const result: ActionResult = {
      success: true,
      response,
      metadata: {
        taskState,
        handlerUsed: handler.response,
      },
    };

    if (handler.show_progress) {
      result.metadata!.showProgress = true;
    }

    if (handler.show_summary) {
      result.metadata!.showSummary = true;
    }

    return result;
  }

  /**
   * Executes a behavior action
   */
  private executeBehaviorAction(
    action: BehaviorAction,
    context: Context
  ): ActionResult {
    const verbosity = action.options?.verbosity || context.preferences?.verbosity || 'concise';

    return {
      success: true,
      response: 'Executing behavior steps',
      actions: action.steps,
      metadata: {
        verbosity,
        options: action.options,
      },
    };
  }

  /**
   * Executes a macro action
   */
  private executeMacroAction(action: MacroAction, context: Context): ActionResult {
    return {
      success: true,
      response: `Executing macro with ${action.steps.length} steps`,
      actions: action.steps,
      metadata: {
        options: action.options,
      },
    };
  }

  /**
   * Generates response text from a template
   */
  private generateResponse(template: string, context: Context): string {
    // Simple template variable replacement
    // In a full implementation, this would be more sophisticated

    const templates: Record<string, string> = {
      execute_next_logical_step: 'Executing the next logical step...',
      explain_blocking_reason: this.explainBlockingReason(context),
      cannot_proceed_user_action_required: this.explainUserActionRequired(context),
      acknowledge_already_complete: 'This task is already complete.',
      explain_what_user_must_do: this.explainUserAction(context),
    };

    return templates[template] || template;
  }

  /**
   * Explains why the system is blocked
   */
  private explainBlockingReason(context: Context): string {
    // This would be more sophisticated in production
    return (
      'I am currently blocked. ' +
      (context.lastCommand
        ? `Last command: "${context.lastCommand}". `
        : '') +
      'Please provide the required input or action to proceed.'
    );
  }

  /**
   * Explains what user action is required
   */
  private explainUserActionRequired(context: Context): string {
    return (
      'I cannot proceed automatically. User action is required. ' +
      this.explainUserAction(context)
    );
  }

  /**
   * Explains what specific action the user must take
   */
  private explainUserAction(context: Context): string {
    // In production, this would be context-aware
    return 'Please complete the manual steps as described above and confirm when done.';
  }

  /**
   * Gets the best matching rule for a command
   */
  getBestMatch(parsed: ParsedCommand, context: Context): PromptingRule | null {
    const matches = this.matchRules(parsed, context);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Checks if input is a known command
   */
  isKnownCommand(input: string): boolean {
    const trigger = input.trim().split(/\s+/)[0].toLowerCase();
    return this.commandMap.has(trigger);
  }

  /**
   * Gets all rules for a trigger
   */
  getRulesForTrigger(trigger: string): PromptingRule[] {
    return this.commandMap.get(trigger.toLowerCase()) || [];
  }

  /**
   * Updates rules (call this when rules change)
   */
  updateRules(rules: PromptingRule[]): void {
    this.rules = rules.filter((r) => r.isActive).sort((a, b) => b.priority - a.priority);
    this.commandMap = this.buildCommandMap();
  }
}
