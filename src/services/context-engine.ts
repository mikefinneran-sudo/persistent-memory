/**
 * Context Engine - Collects and manages execution context
 */

import { Context, TaskState, ActivityType, PreferenceAction } from '../types/prompting-rules';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export class ContextEngine {
  private context: Context;
  private cacheEnabled: boolean;
  private cacheTTL: number;
  private lastCollected?: Date;

  constructor(initialContext?: Partial<Context>, options?: { cacheEnabled?: boolean; cacheTTL?: number }) {
    this.context = {
      taskState: 'ready_to_proceed',
      ...initialContext,
    };
    this.cacheEnabled = options?.cacheEnabled ?? true;
    this.cacheTTL = options?.cacheTTL ?? 30; // 30 seconds default
  }

  /**
   * Collects current execution context
   */
  async collectContext(): Promise<Context> {
    // Check cache
    if (this.cacheEnabled && this.lastCollected) {
      const age = (Date.now() - this.lastCollected.getTime()) / 1000;
      if (age < this.cacheTTL) {
        return this.context;
      }
    }

    // Collect fresh context
    await Promise.all([
      this.collectGitContext(),
      this.collectFileContext(),
      this.collectSessionContext(),
    ]);

    this.lastCollected = new Date();
    return this.context;
  }

  /**
   * Collects Git-related context
   */
  private async collectGitContext(): Promise<void> {
    try {
      // Get current branch
      const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');
      this.context.gitBranch = branch.trim();

      // Get git status
      const { stdout: status } = await execAsync('git status --porcelain');
      this.context.gitStatus = status;
      this.context.hasUncommittedChanges = status.trim().length > 0;

      // Check if there are unpushed commits
      try {
        const { stdout: unpushed } = await execAsync(
          `git log origin/${this.context.gitBranch}..HEAD --oneline`
        );
        this.context.hasPendingPush = unpushed.trim().length > 0;
      } catch {
        // Branch might not have upstream
        this.context.hasPendingPush = false;
      }
    } catch (error) {
      // Not in a git repository or git not available
      this.context.gitBranch = undefined;
      this.context.gitStatus = undefined;
      this.context.hasUncommittedChanges = false;
      this.context.hasPendingPush = false;
    }
  }

  /**
   * Collects file and directory context
   */
  private async collectFileContext(): Promise<void> {
    try {
      this.context.workingDirectory = process.cwd();

      // Get recently modified files (last 10)
      const { stdout: files } = await execAsync(
        'find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -printf "%T@ %p\\n" | sort -rn | head -10 | cut -d" " -f2-'
      );

      this.context.recentFiles = files
        .trim()
        .split('\n')
        .filter((f) => f);

      // Extract file types
      this.context.fileTypes = Array.from(
        new Set(
          this.context.recentFiles
            .map((f) => path.extname(f))
            .filter((ext) => ext)
        )
      );
    } catch (error) {
      this.context.workingDirectory = process.cwd();
      this.context.recentFiles = [];
      this.context.fileTypes = [];
    }
  }

  /**
   * Collects session context
   */
  private async collectSessionContext(): Promise<void> {
    if (!this.context.sessionStartTime) {
      this.context.sessionStartTime = new Date();
    }

    this.context.sessionDuration =
      (Date.now() - this.context.sessionStartTime.getTime()) / 1000 / 60; // minutes
  }

  /**
   * Updates context with new data
   */
  updateContext(updates: Partial<Context>): void {
    this.context = {
      ...this.context,
      ...updates,
    };

    // Invalidate cache
    this.lastCollected = undefined;
  }

  /**
   * Sets task state
   */
  setTaskState(state: TaskState): void {
    this.context.taskState = state;
  }

  /**
   * Sets current activity
   */
  setActivity(activity: ActivityType): void {
    this.context.currentActivity = activity;
  }

  /**
   * Records a command in history
   */
  recordCommand(command: string): void {
    if (!this.context.commandHistory) {
      this.context.commandHistory = [];
    }

    this.context.commandHistory.push(command);
    this.context.lastCommand = command;

    // Keep last 50 commands
    if (this.context.commandHistory.length > 50) {
      this.context.commandHistory = this.context.commandHistory.slice(-50);
    }

    // Update recent commands (last 10)
    this.context.recentCommands = this.context.commandHistory.slice(-10);
  }

  /**
   * Updates todo list context
   */
  updateTodoContext(todos: any[]): void {
    this.context.todoList = todos;
    this.context.activeTodos = todos.filter((t) => t.status === 'in_progress');
    this.context.completedTodos = todos.filter((t) => t.status === 'completed');

    // Determine task state from todos
    if (this.context.activeTodos.length > 0) {
      this.context.taskState = 'in_progress';
    } else if (this.context.completedTodos.length === todos.length && todos.length > 0) {
      this.context.taskState = 'completed';
    } else {
      this.context.taskState = 'ready_to_proceed';
    }
  }

  /**
   * Applies user preferences to context
   */
  applyPreferences(preferences: PreferenceAction['settings']): void {
    this.context.preferences = preferences;
  }

  /**
   * Gets current context (without collection)
   */
  getContext(): Context {
    return this.context;
  }

  /**
   * Clears the context cache
   */
  clearCache(): void {
    this.lastCollected = undefined;
  }

  /**
   * Resets context to initial state
   */
  reset(): void {
    this.context = {
      taskState: 'ready_to_proceed',
      sessionStartTime: new Date(),
    };
    this.lastCollected = undefined;
  }

  /**
   * Infers task state from context
   */
  inferTaskState(): TaskState {
    // Check if waiting for user action
    if (this.context.lastCommand?.toLowerCase().includes('manual')) {
      return 'waiting_for_user';
    }

    // Check if there are active todos
    if (this.context.activeTodos && this.context.activeTodos.length > 0) {
      return 'in_progress';
    }

    // Check if all todos are complete
    if (
      this.context.todoList &&
      this.context.completedTodos &&
      this.context.todoList.length > 0 &&
      this.context.completedTodos.length === this.context.todoList.length
    ) {
      return 'completed';
    }

    // Check if there are uncommitted changes (might be blocked)
    if (this.context.hasUncommittedChanges) {
      return 'ready_to_proceed';
    }

    return 'ready_to_proceed';
  }

  /**
   * Infers current activity from context
   */
  inferActivity(): ActivityType | undefined {
    // Infer from file types
    if (this.context.fileTypes?.some((ft) => ['.ts', '.js', '.py', '.go'].includes(ft))) {
      return 'coding';
    }

    if (this.context.fileTypes?.some((ft) => ['.md', '.txt'].includes(ft))) {
      return 'documenting';
    }

    if (this.context.fileTypes?.some((ft) => ['.test.ts', '.spec.ts'].includes(ft))) {
      return 'testing';
    }

    return undefined;
  }

  /**
   * Auto-updates inferred context fields
   */
  autoInfer(): void {
    this.context.taskState = this.inferTaskState();
    this.context.currentActivity = this.inferActivity();
  }
}
