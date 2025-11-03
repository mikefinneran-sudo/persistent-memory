/**
 * High-level client for Persistent Memory System
 *
 * This client provides a simple API that mirrors the file-based workflow
 * but uses Airtable as the backend storage.
 */

import { AirtableService } from './airtable';
import { SessionInitializer } from './session-initializer';
import { CommandParser } from './command-parser';
import { ContextEngine } from './context-engine';
import {
  ClientConfig,
  User,
  Project,
  ProjectContent,
  WorkingContext,
  Session,
  ContentType,
  ProjectStatus,
  ProjectPriority,
} from '../types';
import {
  SessionContext,
  ParsedCommand,
  ActionResult,
} from '../types/prompting-rules';

export class MemoryClient {
  private airtable: AirtableService;
  private config: ClientConfig;
  private sessionContext?: SessionContext & { parser: CommandParser; contextEngine: ContextEngine };
  private sessionInitializer: SessionInitializer;

  constructor(config: ClientConfig) {
    this.config = config;
    this.airtable = new AirtableService(config);
    this.sessionInitializer = new SessionInitializer(config);
  }

  // ==========================================================================
  // Session & Rules Methods (NEW)
  // ==========================================================================

  /**
   * Initializes session with prompting rules
   * Call this at the start of a session to enable intelligent command parsing
   */
  async initializeSession(): Promise<SessionContext> {
    this.sessionContext = await this.sessionInitializer.initialize() as any;
    return this.sessionContext;
  }

  /**
   * Processes a natural language command using prompting rules
   *
   * Example: processCommand("Go") will contextually execute next step or explain why blocked
   */
  async processCommand(input: string): Promise<ActionResult> {
    // Auto-initialize if not done
    if (!this.sessionContext) {
      await this.initializeSession();
    }

    const { parser, contextEngine } = this.sessionContext!;

    // Parse the command
    const parsed = parser.parse(input);

    // Update context
    await contextEngine.collectContext();
    contextEngine.autoInfer();
    contextEngine.recordCommand(input);

    const context = contextEngine.getContext();

    // Find matching rule
    const rule = parser.getBestMatch(parsed, context);

    if (!rule) {
      return {
        success: false,
        error: `Unknown command: "${input}". No matching rules found.`,
      };
    }

    // Execute the rule's action
    const result = await parser.executeAction(rule, context);

    return result;
  }

  /**
   * Updates the current todo list context
   */
  updateTodoContext(todos: any[]): void {
    if (!this.sessionContext) return;
    this.sessionContext.contextEngine.updateTodoContext(todos);
  }

  /**
   * Sets the current task state
   */
  setTaskState(state: 'ready_to_proceed' | 'blocked' | 'waiting_for_user' | 'in_progress' | 'completed' | 'paused'): void {
    if (!this.sessionContext) return;
    this.sessionContext.contextEngine.setTaskState(state);
  }

  /**
   * Gets the current session context
   */
  getSessionContext(): SessionContext | undefined {
    return this.sessionContext;
  }

  /**
   * Refreshes prompting rules (reloads from Airtable)
   */
  async refreshRules(): Promise<void> {
    if (!this.sessionContext) return;
    this.sessionContext = await this.sessionInitializer.refresh(this.sessionContext) as any;
  }

  // ==========================================================================
  // User Methods (Layer 1: Global Preferences)
  // ==========================================================================

  /**
   * Gets the current user's preferences
   * Equivalent to reading CLAUDE.md
   */
  async getPreferences(): Promise<User | null> {
    return this.airtable.getUser();
  }

  /**
   * Updates user preferences
   * Equivalent to editing CLAUDE.md
   */
  async updatePreferences(
    updates: Partial<Omit<User, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<User> {
    const current = await this.airtable.getUser();

    const user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: this.config.userId,
      name: updates.name || current?.name || '',
      email: updates.email || current?.email || '',
      useCase: updates.useCase ?? current?.useCase,
      communicationStyle: updates.communicationStyle ?? current?.communicationStyle,
      fileConventions: updates.fileConventions ?? current?.fileConventions,
      workflowPrinciples: updates.workflowPrinciples ?? current?.workflowPrinciples,
      defaultLocations: updates.defaultLocations ?? current?.defaultLocations,
      preferences: updates.preferences ?? current?.preferences,
    };

    return this.airtable.upsertUser(user);
  }

  // ==========================================================================
  // Project Methods (Layer 2: Project Registry)
  // ==========================================================================

  /**
   * Lists all active projects
   * Equivalent to reading PROJECT-REGISTRY.md
   */
  async listProjects(status?: ProjectStatus | ProjectStatus[]): Promise<Project[]> {
    const result = await this.airtable.listProjects({
      userId: this.config.userId,
      status: status || ['Active', 'Planning', 'Research'],
    });
    return result.data;
  }

  /**
   * Gets a specific project
   */
  async getProject(projectName: string): Promise<Project | null> {
    return this.airtable.getProject(projectName);
  }

  /**
   * Creates a new project
   * Equivalent to adding a project to PROJECT-REGISTRY.md and creating its workspace
   */
  async createProject(
    projectName: string,
    displayName: string,
    options?: {
      description?: string;
      status?: ProjectStatus;
      priority?: ProjectPriority;
      tags?: string[];
      initContent?: boolean; // Initialize with default content
    }
  ): Promise<Project> {
    const project = await this.airtable.createProject({
      userId: this.config.userId,
      projectName,
      displayName,
      description: options?.description,
      status: options?.status || 'Planning',
      priority: options?.priority || 'Medium',
      tags: options?.tags,
      startDate: new Date(),
    });

    // Initialize with default content if requested
    if (options?.initContent !== false) {
      await this.initializeProjectContent(project.id!);
    }

    return project;
  }

  /**
   * Updates a project
   */
  async updateProject(
    projectName: string,
    updates: Partial<Omit<Project, 'id' | 'userId' | 'projectName' | 'createdAt' | 'updatedAt'>>
  ): Promise<Project> {
    return this.airtable.updateProject(projectName, updates);
  }

  /**
   * Archives a project
   */
  async archiveProject(projectName: string): Promise<Project> {
    return this.airtable.updateProject(projectName, {
      status: 'Archived',
      completedAt: new Date(),
    });
  }

  // ==========================================================================
  // Project Content Methods (Layer 3: Project Workspaces)
  // ==========================================================================

  /**
   * Gets project content by type
   * Equivalent to reading projects/[name]/README.md, STATUS.md, etc.
   */
  async getProjectContent(
    projectName: string,
    contentType: ContentType
  ): Promise<string | null> {
    const project = await this.airtable.getProject(projectName);
    if (!project?.id) return null;

    const content = await this.airtable.getProjectContent(project.id, contentType);
    return content?.content || null;
  }

  /**
   * Updates project content
   * Equivalent to editing projects/[name]/README.md, STATUS.md, etc.
   */
  async updateProjectContent(
    projectName: string,
    contentType: ContentType,
    content: string
  ): Promise<void> {
    const project = await this.airtable.getProject(projectName);
    if (!project?.id) {
      throw new Error(`Project not found: ${projectName}`);
    }

    await this.airtable.updateProjectContent(project.id, contentType, content);
  }

  /**
   * Gets all content for a project
   * Equivalent to reading all files in projects/[name]/
   */
  async getAllProjectContent(projectName: string): Promise<Record<string, string>> {
    const project = await this.airtable.getProject(projectName);
    if (!project?.id) return {};

    const contents = await this.airtable.getAllProjectContent(project.id);

    const result: Record<string, string> = {};
    for (const content of contents) {
      const key = content.customType || content.contentType;
      result[key] = content.content;
    }

    return result;
  }

  /**
   * Initializes a project with default content templates
   */
  private async initializeProjectContent(projectId: number): Promise<void> {
    const templates = {
      README: `# Project Overview

## Quick Links
- [Project Details](PROJECT.md)
- [Current Status](STATUS.md)
- [Task Backlog](BACKLOG.md)

## Description
[Add project description here]

## Getting Started
[Add setup instructions here]
`,
      PROJECT: `# Project Details

## Vision
[What is this project trying to achieve?]

## Architecture
[High-level technical architecture]

## Key Decisions
[Major technical or product decisions]
`,
      STATUS: `# Current Status

## What's Working
- [Feature 1]
- [Feature 2]

## In Progress
- [Task 1]
- [Task 2]

## Blockers
[Any blockers or open questions]
`,
      BACKLOG: `# Task Backlog

## High Priority
- [ ] [Task 1]
- [ ] [Task 2]

## Medium Priority
- [ ] [Task 3]
- [ ] [Task 4]

## Low Priority
- [ ] [Task 5]
- [ ] [Task 6]

## Completed
- [x] [Completed task]
`,
    };

    for (const [type, content] of Object.entries(templates)) {
      await this.airtable.updateProjectContent(
        projectId,
        type as ContentType,
        content
      );
    }
  }

  // ==========================================================================
  // Working Context Methods (Layer 4: Current Focus)
  // ==========================================================================

  /**
   * Gets the current working context
   * Equivalent to reading WORKING-CONTEXT.md
   */
  async getCurrentContext(): Promise<WorkingContext | null> {
    return this.airtable.getCurrentWorkingContext();
  }

  /**
   * Switches to a different project
   * Equivalent to updating WORKING-CONTEXT.md with new focus
   */
  async switchToProject(projectName: string): Promise<void> {
    const project = await this.airtable.getProject(projectName);
    if (!project?.id) {
      throw new Error(`Project not found: ${projectName}`);
    }

    // Update project's lastAccessedAt
    await this.airtable.updateProject(projectName, {
      lastAccessedAt: new Date(),
    });

    // Update working context
    const context = await this.airtable.getCurrentWorkingContext();
    if (context) {
      await this.airtable.updateWorkingContext({
        currentProjectId: project.id,
        primaryFocus: project.displayName,
      });
    } else {
      // Create new context if none exists
      await this.airtable.createWorkingContext({
        userId: this.config.userId,
        weekStart: this.getWeekStart(),
        currentProjectId: project.id,
        primaryFocus: project.displayName,
        isActive: true,
      });
    }
  }

  /**
   * Updates the current working context
   * Equivalent to editing WORKING-CONTEXT.md
   */
  async updateContext(
    updates: Partial<Omit<WorkingContext, 'id' | 'userId' | 'weekStart' | 'isActive'>>
  ): Promise<WorkingContext> {
    return this.airtable.updateWorkingContext(updates);
  }

  /**
   * Starts a new week (resets working context)
   * Equivalent to archiving old WORKING-CONTEXT.md and creating new one
   */
  async startNewWeek(primaryFocus?: string): Promise<WorkingContext> {
    return this.airtable.createWorkingContext({
      userId: this.config.userId,
      weekStart: this.getWeekStart(),
      primaryFocus,
      isActive: true,
    });
  }

  /**
   * Gets the start of the current week (Monday)
   */
  private getWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  // ==========================================================================
  // Session Methods
  // ==========================================================================

  /**
   * Starts a new session
   */
  async startSession(projectName?: string): Promise<Session> {
    let projectId: number | undefined;

    if (projectName) {
      const project = await this.airtable.getProject(projectName);
      projectId = project?.id;
    }

    return this.airtable.createSession({
      userId: this.config.userId,
      projectId,
      sessionStart: new Date(),
    });
  }

  /**
   * Ends a session
   */
  async endSession(
    sessionId: number,
    summary?: string,
    tasksCompleted?: any[]
  ): Promise<Session> {
    return this.airtable.updateSession(sessionId, {
      sessionEnd: new Date(),
      summary,
      tasksCompleted,
    });
  }

  /**
   * Gets recent sessions
   */
  async getRecentSessions(projectName?: string, limit: number = 10): Promise<Session[]> {
    let projectId: number | undefined;

    if (projectName) {
      const project = await this.airtable.getProject(projectName);
      projectId = project?.id;
    }

    const result = await this.airtable.listSessions({
      userId: this.config.userId,
      projectId,
      limit,
    });

    return result.data;
  }

  // ==========================================================================
  // Convenience Methods
  // ==========================================================================

  /**
   * Complete workflow: Load all context needed to start working
   * Equivalent to reading CLAUDE.md, PROJECT-REGISTRY.md, WORKING-CONTEXT.md
   */
  async loadSession(): Promise<{
    user: User | null;
    context: WorkingContext | null;
    activeProjects: Project[];
    currentProject: Project | null;
  }> {
    const [user, context, activeProjects] = await Promise.all([
      this.airtable.getUser(),
      this.airtable.getCurrentWorkingContext(),
      this.airtable.listProjects({
        userId: this.config.userId,
        status: ['Active', 'Planning', 'Research'],
        limit: 10,
      }),
    ]);

    let currentProject: Project | null = null;
    if (context?.currentProjectId) {
      const project = activeProjects.data.find((p) => p.id === context.currentProjectId);
      currentProject = project || null;
    }

    return {
      user,
      context,
      activeProjects: activeProjects.data,
      currentProject,
    };
  }

  /**
   * Complete workflow: Load full project context
   * Equivalent to reading projects/[name]/* files
   */
  async loadProject(projectName: string): Promise<{
    project: Project;
    content: Record<string, string>;
  }> {
    const project = await this.airtable.getProject(projectName);
    if (!project) {
      throw new Error(`Project not found: ${projectName}`);
    }

    const content = await this.getAllProjectContent(projectName);

    // Update last accessed
    await this.airtable.updateProject(projectName, {
      lastAccessedAt: new Date(),
    });

    return {
      project,
      content,
    };
  }
}
