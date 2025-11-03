/**
 * Session Initializer - Loads rules and initializes session context
 */

import { SessionContext, Context, PreferenceAction } from '../types/prompting-rules';
import { ClientConfig } from '../types';
import { RulesClient } from './rules-client';
import { CommandParser } from './command-parser';
import { ContextEngine } from './context-engine';

export class SessionInitializer {
  private config: ClientConfig;
  private rulesClient: RulesClient;

  constructor(config: ClientConfig) {
    this.config = config;
    this.rulesClient = new RulesClient(config);
  }

  /**
   * Initializes a new session with rules and context
   */
  async initialize(): Promise<SessionContext> {
    // Load user's prompting rules
    const rules = await this.rulesClient.loadRules(this.config.userId);

    // If no rules exist, create defaults
    if (rules.length === 0) {
      console.log('No rules found. Creating default rules...');
      const defaultRules = await this.rulesClient.createDefaultRules(this.config.userId);
      rules.push(...defaultRules);
    }

    // Extract preferences from rules
    const preferenceRule = rules.find((r) => r.ruleType === 'PREFERENCE' && r.isActive);
    const preferences = preferenceRule
      ? (preferenceRule.action as PreferenceAction).settings
      : {};

    // Initialize context engine
    const contextEngine = new ContextEngine(
      { preferences },
      {
        cacheEnabled: this.config.cache?.enabled,
        cacheTTL: this.config.cache?.ttl,
      }
    );

    // Collect initial context
    const context = await contextEngine.collectContext();

    // Auto-infer task state and activity
    contextEngine.autoInfer();

    // Create command parser with rules
    const parser = new CommandParser(rules);

    // Build command registry
    const commandRegistry = new Map();
    for (const rule of rules) {
      if (rule.ruleType === 'COMMAND') {
        const existing = commandRegistry.get(rule.trigger) || [];
        existing.push(rule);
        commandRegistry.set(rule.trigger, existing);
      }
    }

    return {
      userId: this.config.userId,
      rules,
      context,
      commandRegistry,
      preferences,
      parser,
      contextEngine,
    } as SessionContext & {parser: CommandParser; contextEngine: ContextEngine};
  }

  /**
   * Refreshes session context (reloads rules)
   */
  async refresh(sessionContext: SessionContext): Promise<SessionContext> {
    const rules = await this.rulesClient.loadRules(this.config.userId);

    // Update parser with new rules
    const parser = new CommandParser(rules);

    // Rebuild command registry
    const commandRegistry = new Map();
    for (const rule of rules) {
      if (rule.ruleType === 'COMMAND') {
        const existing = commandRegistry.get(rule.trigger) || [];
        existing.push(rule);
        commandRegistry.set(rule.trigger, existing);
      }
    }

    // Extract preferences
    const preferenceRule = rules.find((r) => r.ruleType === 'PREFERENCE' && r.isActive);
    const preferences = preferenceRule
      ? (preferenceRule.action as PreferenceAction).settings
      : sessionContext.preferences;

    return {
      ...sessionContext,
      rules,
      commandRegistry,
      preferences,
      parser,
    } as SessionContext & {parser: CommandParser};
  }

  /**
   * Gets the rules client
   */
  getRulesClient(): RulesClient {
    return this.rulesClient;
  }
}
