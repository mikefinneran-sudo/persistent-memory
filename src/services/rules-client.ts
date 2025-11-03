/**
 * Rules Client - Manages prompting rules in Airtable
 */

import Airtable, { FieldSet } from 'airtable';
import {
  PromptingRule,
  PromptingRuleCreate,
  PromptingRuleUpdate,
  RuleQuery,
  RuleAction,
  ContextPattern,
  RuleExample,
} from '../types/prompting-rules';
import { ClientConfig } from '../types';
import { Cache } from '../utils/cache';
import { retry, isRetryableError } from '../utils/retry';

const PROMPTING_RULES_TABLE = 'PromptingRules';

export class RulesClient {
  private base: Airtable.Base;
  private cache: Cache;
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;

    Airtable.configure({
      apiKey: config.apiKey,
    });
    this.base = Airtable.base(config.baseId);

    this.cache = new Cache(config.cache!);
  }

  /**
   * Loads all active rules for a user
   */
  async loadRules(userId: string): Promise<PromptingRule[]> {
    const cacheKey = `rules:${userId}`;
    const cached = this.cache.get<PromptingRule[]>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const records = await this.base(PROMPTING_RULES_TABLE)
        .select({
          filterByFormula: `AND({userId} = '${userId}', {isActive} = TRUE())`,
          sort: [{ field: 'priority', direction: 'desc' }],
        })
        .all();

      const rules = records.map(this.recordToRule.bind(this));

      // Cache for 1 hour
      this.cache.set(cacheKey, rules, 3600);

      return rules;
    });
  }

  /**
   * Queries rules with filters
   */
  async queryRules(query: RuleQuery): Promise<PromptingRule[]> {
    return this.withRetry(async () => {
      let formula = `{userId} = '${query.userId}'`;

      if (query.ruleType) {
        const types = Array.isArray(query.ruleType) ? query.ruleType : [query.ruleType];
        const typeFormula = types.map((t) => `{ruleType} = '${t}'`).join(', ');
        formula += ` AND OR(${typeFormula})`;
      }

      if (query.category) {
        formula += ` AND {category} = '${query.category}'`;
      }

      if (query.trigger) {
        formula += ` AND {trigger} = '${query.trigger}'`;
      }

      if (query.isActive !== undefined) {
        formula += ` AND {isActive} = ${query.isActive ? 'TRUE()' : 'FALSE()'}`;
      }

      const records = await this.base(PROMPTING_RULES_TABLE)
        .select({
          filterByFormula: `AND(${formula})`,
          sort: [{ field: 'priority', direction: 'desc' }],
          maxRecords: query.limit || 100,
        })
        .firstPage();

      return records.map(this.recordToRule.bind(this));
    });
  }

  /**
   * Creates a new rule
   */
  async createRule(rule: PromptingRuleCreate): Promise<PromptingRule> {
    return this.withRetry(async () => {
      const fields = this.ruleToFields(rule);
      const record = await this.base(PROMPTING_RULES_TABLE).create(fields);

      // Invalidate cache
      this.cache.invalidate(`rules:${rule.userId}`);

      return this.recordToRule(record);
    });
  }

  /**
   * Updates a rule
   */
  async updateRule(id: number, updates: PromptingRuleUpdate): Promise<PromptingRule> {
    return this.withRetry(async () => {
      // Find the record
      const records = await this.base(PROMPTING_RULES_TABLE)
        .select({
          filterByFormula: `{id} = ${id}`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) {
        throw new Error(`Rule not found: ${id}`);
      }

      const fields = this.ruleToFields(updates as PromptingRuleCreate);
      const record = await this.base(PROMPTING_RULES_TABLE).update(records[0].id, fields);

      // Invalidate cache
      const userId = record.get('userId') as string;
      this.cache.invalidate(`rules:${userId}`);

      return this.recordToRule(record);
    });
  }

  /**
   * Deletes a rule (marks as inactive)
   */
  async deleteRule(id: number): Promise<void> {
    return this.withRetry(async () => {
      const records = await this.base(PROMPTING_RULES_TABLE)
        .select({
          filterByFormula: `{id} = ${id}`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) {
        throw new Error(`Rule not found: ${id}`);
      }

      await this.base(PROMPTING_RULES_TABLE).update(records[0].id, {
        isActive: false,
      });

      // Invalidate cache
      const userId = records[0].get('userId') as string;
      this.cache.invalidate(`rules:${userId}`);
    });
  }

  /**
   * Gets a single rule by ID
   */
  async getRule(id: number): Promise<PromptingRule | null> {
    return this.withRetry(async () => {
      const records = await this.base(PROMPTING_RULES_TABLE)
        .select({
          filterByFormula: `{id} = ${id}`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) {
        return null;
      }

      return this.recordToRule(records[0]);
    });
  }

  /**
   * Creates default rules for a new user
   */
  async createDefaultRules(userId: string): Promise<PromptingRule[]> {
    const defaultRules: PromptingRuleCreate[] = [
      // Go command - ready state
      {
        userId,
        ruleType: 'COMMAND',
        trigger: 'Go',
        contextPatterns: [{ type: 'task_state', value: 'ready_to_proceed' }],
        action: {
          type: 'contextual_execution',
          handlers: {
            ready_to_proceed: {
              response: 'execute_next_logical_step',
              show_progress: true,
            },
          },
        },
        priority: 100,
        isActive: true,
        description: 'Execute next step when ready',
      },
      // Go command - blocked state
      {
        userId,
        ruleType: 'COMMAND',
        trigger: 'Go',
        contextPatterns: [{ type: 'task_state', value: 'blocked' }],
        action: {
          type: 'contextual_execution',
          handlers: {
            blocked: {
              response: 'explain_blocking_reason',
              details: 'explain_what_user_must_do',
            },
          },
        },
        priority: 95,
        isActive: true,
        description: 'Explain blocking reason when blocked',
      },
      // Done command
      {
        userId,
        ruleType: 'COMMAND',
        trigger: 'Done',
        action: {
          type: 'contextual_execution',
          handlers: {
            default: {
              response: 'acknowledge_already_complete',
              show_summary: true,
            },
          },
        },
        priority: 90,
        isActive: true,
        description: 'Acknowledge completion',
      },
      // Communication preferences
      {
        userId,
        ruleType: 'PREFERENCE',
        category: 'communication',
        trigger: 'always',
        action: {
          type: 'preference',
          settings: {
            verbosity: 'concise',
            use_emojis: false,
            error_detail_level: 'full',
            proactive_suggestions: true,
            confirm_destructive_actions: true,
          },
        },
        priority: 50,
        isActive: true,
        description: 'Default communication preferences',
      },
    ];

    const created: PromptingRule[] = [];
    for (const rule of defaultRules) {
      const createdRule = await this.createRule(rule);
      created.push(createdRule);
    }

    return created;
  }

  /**
   * Converts Airtable record to PromptingRule
   */
  private recordToRule(record: Airtable.Record<FieldSet>): PromptingRule {
    return {
      id: parseInt(record.get('id') as string),
      userId: record.get('userId') as string,
      ruleType: record.get('ruleType') as PromptingRule['ruleType'],
      category: record.get('category') as string | undefined,
      trigger: record.get('trigger') as string,
      contextPatterns: this.parseJson(record.get('contextPatterns') as string, []),
      action: this.parseJson(record.get('action') as string, {}),
      priority: record.get('priority') as number,
      isActive: record.get('isActive') as boolean,
      description: record.get('description') as string | undefined,
      examples: this.parseJson(record.get('examples') as string, []),
      createdAt: this.parseDate(record.get('createdAt') as string),
      updatedAt: this.parseDate(record.get('updatedAt') as string),
    };
  }

  /**
   * Converts PromptingRule to Airtable fields
   */
  private ruleToFields(rule: PromptingRuleCreate): FieldSet {
    return {
      userId: rule.userId,
      ruleType: rule.ruleType,
      category: rule.category,
      trigger: rule.trigger,
      contextPatterns: rule.contextPatterns ? JSON.stringify(rule.contextPatterns) : undefined,
      action: JSON.stringify(rule.action),
      priority: rule.priority,
      isActive: rule.isActive,
      description: rule.description,
      examples: rule.examples ? JSON.stringify(rule.examples) : undefined,
    };
  }

  /**
   * Parses JSON field safely
   */
  private parseJson<T>(value: string | undefined, defaultValue: T): T {
    if (!value) return defaultValue;
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Converts Airtable date string to Date object
   */
  private parseDate(value: string | undefined): Date | undefined {
    return value ? new Date(value) : undefined;
  }

  /**
   * Executes a function with retry logic
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    return retry(fn, {
      attempts: this.config.retryAttempts || 3,
      delay: this.config.retryDelay || 1000,
      backoff: true,
      onRetry: (error, attempt) => {
        if (isRetryableError(error)) {
          console.warn(
            `Retrying request (attempt ${attempt}/${this.config.retryAttempts}):`,
            error.message
          );
        }
      },
    });
  }
}
