/**
 * Airtable service for Persistent Memory System
 */

import Airtable, { FieldSet, Records } from 'airtable';
import {
  User,
  Project,
  ProjectContent,
  WorkingContext,
  Session,
  ClientConfig,
  ProjectQuery,
  SessionQuery,
  PaginatedResponse,
} from '../types';
import { TABLES } from '../config';
import { Cache } from '../utils/cache';
import { retry, isRetryableError } from '../utils/retry';

export class AirtableService {
  private base: Airtable.Base;
  private cache: Cache;
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;

    // Initialize Airtable
    Airtable.configure({
      apiKey: config.apiKey,
    });
    this.base = Airtable.base(config.baseId);

    // Initialize cache
    this.cache = new Cache(config.cache!);
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

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

  // ==========================================================================
  // User Methods
  // ==========================================================================

  /**
   * Gets the current user
   */
  async getUser(): Promise<User | null> {
    const cacheKey = `user:${this.config.userId}`;
    const cached = this.cache.get<User>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const records = await this.base(TABLES.USERS)
        .select({
          filterByFormula: `{userId} = '${this.config.userId}'`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) {
        return null;
      }

      const record = records[0];
      const user: User = {
        id: parseInt(record.get('id') as string),
        userId: record.get('userId') as string,
        name: record.get('name') as string,
        email: record.get('email') as string,
        useCase: record.get('useCase') as string | undefined,
        communicationStyle: record.get('communicationStyle') as string | undefined,
        fileConventions: record.get('fileConventions') as string | undefined,
        workflowPrinciples: record.get('workflowPrinciples') as string | undefined,
        defaultLocations: this.parseJson(record.get('defaultLocations') as string, {}),
        preferences: this.parseJson(record.get('preferences') as string, {}),
        createdAt: this.parseDate(record.get('createdAt') as string),
        updatedAt: this.parseDate(record.get('updatedAt') as string),
      };

      this.cache.set(cacheKey, user, 3600); // Cache for 1 hour
      return user;
    });
  }

  /**
   * Creates or updates the user
   */
  async upsertUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.withRetry(async () => {
      const existing = await this.getUser();

      const fields: FieldSet = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        useCase: user.useCase,
        communicationStyle: user.communicationStyle,
        fileConventions: user.fileConventions,
        workflowPrinciples: user.workflowPrinciples,
        defaultLocations: user.defaultLocations ? JSON.stringify(user.defaultLocations) : undefined,
        preferences: user.preferences ? JSON.stringify(user.preferences) : undefined,
      };

      let record;
      if (existing?.id) {
        // Update existing
        const records = await this.base(TABLES.USERS)
          .select({
            filterByFormula: `{userId} = '${user.userId}'`,
            maxRecords: 1,
          })
          .firstPage();

        if (records.length > 0) {
          record = await this.base(TABLES.USERS).update(records[0].id, fields);
        }
      } else {
        // Create new
        record = await this.base(TABLES.USERS).create(fields);
      }

      if (!record) {
        throw new Error('Failed to upsert user');
      }

      // Invalidate cache
      this.cache.invalidate(`user:${user.userId}`);

      return {
        id: parseInt(record.get('id') as string),
        userId: record.get('userId') as string,
        name: record.get('name') as string,
        email: record.get('email') as string,
        useCase: record.get('useCase') as string | undefined,
        communicationStyle: record.get('communicationStyle') as string | undefined,
        fileConventions: record.get('fileConventions') as string | undefined,
        workflowPrinciples: record.get('workflowPrinciples') as string | undefined,
        defaultLocations: this.parseJson(record.get('defaultLocations') as string, {}),
        preferences: this.parseJson(record.get('preferences') as string, {}),
        createdAt: this.parseDate(record.get('createdAt') as string),
        updatedAt: this.parseDate(record.get('updatedAt') as string),
      };
    });
  }

  // ==========================================================================
  // Project Methods
  // ==========================================================================

  /**
   * Gets a project by name
   */
  async getProject(projectName: string): Promise<Project | null> {
    const cacheKey = `project:${this.config.userId}:${projectName}`;
    const cached = this.cache.get<Project>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const records = await this.base(TABLES.PROJECTS)
        .select({
          filterByFormula: `AND({userId} = '${this.config.userId}', {projectName} = '${projectName}')`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) {
        return null;
      }

      const project = this.recordToProject(records[0]);
      this.cache.set(cacheKey, project);
      return project;
    });
  }

  /**
   * Lists projects with optional filtering
   */
  async listProjects(query?: ProjectQuery): Promise<PaginatedResponse<Project>> {
    return this.withRetry(async () => {
      let formula = `{userId} = '${this.config.userId}'`;

      // Add status filter
      if (query?.status) {
        const statuses = Array.isArray(query.status) ? query.status : [query.status];
        const statusFormula = statuses.map((s) => `{status} = '${s}'`).join(', ');
        formula += ` AND OR(${statusFormula})`;
      }

      // Add priority filter
      if (query?.priority) {
        formula += ` AND {priority} = '${query.priority}'`;
      }

      const records = await this.base(TABLES.PROJECTS)
        .select({
          filterByFormula: `AND(${formula})`,
          sort: [{ field: 'lastAccessedAt', direction: 'desc' }],
          maxRecords: query?.limit || 100,
        })
        .firstPage();

      const projects = records.map(this.recordToProject.bind(this));

      return {
        data: projects,
        total: projects.length,
        limit: query?.limit || 100,
        offset: query?.offset || 0,
        hasMore: false, // Simplified for now
      };
    });
  }

  /**
   * Creates a new project
   */
  async createProject(
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Project> {
    return this.withRetry(async () => {
      const fields: FieldSet = {
        userId: project.userId,
        projectName: project.projectName,
        displayName: project.displayName,
        description: project.description,
        status: project.status,
        priority: project.priority,
        location: project.location,
        tags: project.tags,
        startDate: project.startDate?.toISOString(),
        lastAccessedAt: new Date().toISOString(),
      };

      const record = await this.base(TABLES.PROJECTS).create(fields);

      // Invalidate cache
      this.cache.invalidatePattern(`project:${this.config.userId}`);

      return this.recordToProject(record);
    });
  }

  /**
   * Updates a project
   */
  async updateProject(
    projectName: string,
    updates: Partial<Project>
  ): Promise<Project> {
    return this.withRetry(async () => {
      // Find the record
      const records = await this.base(TABLES.PROJECTS)
        .select({
          filterByFormula: `AND({userId} = '${this.config.userId}', {projectName} = '${projectName}')`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) {
        throw new Error(`Project not found: ${projectName}`);
      }

      const fields: FieldSet = {};
      if (updates.displayName) fields.displayName = updates.displayName;
      if (updates.description) fields.description = updates.description;
      if (updates.status) fields.status = updates.status;
      if (updates.priority) fields.priority = updates.priority;
      if (updates.location) fields.location = updates.location;
      if (updates.tags) fields.tags = updates.tags;
      if (updates.completedAt) fields.completedAt = updates.completedAt.toISOString();

      // Always update lastAccessedAt
      fields.lastAccessedAt = new Date().toISOString();

      const record = await this.base(TABLES.PROJECTS).update(records[0].id, fields);

      // Invalidate cache
      this.cache.invalidate(`project:${this.config.userId}:${projectName}`);
      this.cache.invalidatePattern(`project:${this.config.userId}`);

      return this.recordToProject(record);
    });
  }

  /**
   * Converts Airtable record to Project
   */
  private recordToProject(record: Airtable.Record<FieldSet>): Project {
    return {
      id: parseInt(record.get('id') as string),
      userId: record.get('userId') as string,
      projectName: record.get('projectName') as string,
      displayName: record.get('displayName') as string,
      description: record.get('description') as string | undefined,
      status: record.get('status') as Project['status'],
      priority: record.get('priority') as Project['priority'],
      location: record.get('location') as string | undefined,
      tags: record.get('tags') as string[] | undefined,
      startDate: this.parseDate(record.get('startDate') as string),
      lastAccessedAt: this.parseDate(record.get('lastAccessedAt') as string),
      completedAt: this.parseDate(record.get('completedAt') as string),
      createdAt: this.parseDate(record.get('createdAt') as string),
      updatedAt: this.parseDate(record.get('updatedAt') as string),
    };
  }

  // ==========================================================================
  // Project Content Methods
  // ==========================================================================

  /**
   * Gets project content by type
   */
  async getProjectContent(
    projectId: number,
    contentType: ProjectContent['contentType']
  ): Promise<ProjectContent | null> {
    const cacheKey = `content:${projectId}:${contentType}`;
    const cached = this.cache.get<ProjectContent>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const records = await this.base(TABLES.PROJECT_CONTENT)
        .select({
          filterByFormula: `AND({projectId} = ${projectId}, {contentType} = '${contentType}', {isActive} = TRUE())`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) {
        return null;
      }

      const content = this.recordToProjectContent(records[0]);
      this.cache.set(cacheKey, content);
      return content;
    });
  }

  /**
   * Gets all content for a project
   */
  async getAllProjectContent(projectId: number): Promise<ProjectContent[]> {
    return this.withRetry(async () => {
      const records = await this.base(TABLES.PROJECT_CONTENT)
        .select({
          filterByFormula: `AND({projectId} = ${projectId}, {isActive} = TRUE())`,
        })
        .all();

      return records.map(this.recordToProjectContent.bind(this));
    });
  }

  /**
   * Updates project content (creates new version)
   */
  async updateProjectContent(
    projectId: number,
    contentType: ProjectContent['contentType'],
    content: string,
    customType?: string
  ): Promise<ProjectContent> {
    return this.withRetry(async () => {
      // Deactivate current version
      const existing = await this.base(TABLES.PROJECT_CONTENT)
        .select({
          filterByFormula: `AND({projectId} = ${projectId}, {contentType} = '${contentType}', {isActive} = TRUE())`,
        })
        .all();

      if (existing.length > 0) {
        await Promise.all(
          existing.map((record) =>
            this.base(TABLES.PROJECT_CONTENT).update(record.id, { isActive: false })
          )
        );
      }

      // Get next version number
      const version = existing.length > 0
        ? Math.max(...existing.map((r) => (r.get('version') as number) || 1)) + 1
        : 1;

      // Create new version
      const fields: FieldSet = {
        projectId,
        contentType,
        customType,
        content,
        version,
        isActive: true,
      };

      const record = await this.base(TABLES.PROJECT_CONTENT).create(fields);

      // Invalidate cache
      this.cache.invalidate(`content:${projectId}:${contentType}`);

      return this.recordToProjectContent(record);
    });
  }

  /**
   * Converts Airtable record to ProjectContent
   */
  private recordToProjectContent(record: Airtable.Record<FieldSet>): ProjectContent {
    return {
      id: parseInt(record.get('id') as string),
      projectId: record.get('projectId') as number,
      contentType: record.get('contentType') as ProjectContent['contentType'],
      customType: record.get('customType') as string | undefined,
      content: record.get('content') as string,
      version: record.get('version') as number,
      isActive: record.get('isActive') as boolean,
      createdAt: this.parseDate(record.get('createdAt') as string),
      updatedAt: this.parseDate(record.get('updatedAt') as string),
    };
  }

  // ==========================================================================
  // Working Context Methods
  // ==========================================================================

  /**
   * Gets the current working context
   */
  async getCurrentWorkingContext(): Promise<WorkingContext | null> {
    const cacheKey = `context:${this.config.userId}:current`;
    const cached = this.cache.get<WorkingContext>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const records = await this.base(TABLES.WORKING_CONTEXT)
        .select({
          filterByFormula: `AND({userId} = '${this.config.userId}', {isActive} = TRUE())`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) {
        return null;
      }

      const context = this.recordToWorkingContext(records[0]);
      this.cache.set(cacheKey, context, 60); // Cache for 1 minute
      return context;
    });
  }

  /**
   * Creates a new working context (usually for a new week)
   */
  async createWorkingContext(
    context: Omit<WorkingContext, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkingContext> {
    return this.withRetry(async () => {
      // Deactivate current context
      const existing = await this.base(TABLES.WORKING_CONTEXT)
        .select({
          filterByFormula: `AND({userId} = '${this.config.userId}', {isActive} = TRUE())`,
        })
        .all();

      if (existing.length > 0) {
        await Promise.all(
          existing.map((record) =>
            this.base(TABLES.WORKING_CONTEXT).update(record.id, { isActive: false })
          )
        );
      }

      // Create new context
      const fields: FieldSet = {
        userId: context.userId,
        weekStart: context.weekStart.toISOString(),
        primaryFocus: context.primaryFocus,
        currentProjectId: context.currentProjectId,
        completedTasks: context.completedTasks ? JSON.stringify(context.completedTasks) : undefined,
        activeFiles: context.activeFiles ? JSON.stringify(context.activeFiles) : undefined,
        nextActions: context.nextActions ? JSON.stringify(context.nextActions) : undefined,
        openQuestions: context.openQuestions ? JSON.stringify(context.openQuestions) : undefined,
        sessionLog: context.sessionLog ? JSON.stringify(context.sessionLog) : undefined,
        isActive: true,
      };

      const record = await this.base(TABLES.WORKING_CONTEXT).create(fields);

      // Invalidate cache
      this.cache.invalidate(`context:${this.config.userId}:current`);

      return this.recordToWorkingContext(record);
    });
  }

  /**
   * Updates the current working context
   */
  async updateWorkingContext(
    updates: Partial<Omit<WorkingContext, 'id' | 'userId' | 'weekStart' | 'isActive'>>
  ): Promise<WorkingContext> {
    return this.withRetry(async () => {
      const current = await this.getCurrentWorkingContext();
      if (!current) {
        throw new Error('No active working context found');
      }

      // Find the record
      const records = await this.base(TABLES.WORKING_CONTEXT)
        .select({
          filterByFormula: `AND({userId} = '${this.config.userId}', {isActive} = TRUE())`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) {
        throw new Error('No active working context found');
      }

      const fields: FieldSet = {};
      if (updates.primaryFocus !== undefined) fields.primaryFocus = updates.primaryFocus;
      if (updates.currentProjectId !== undefined) fields.currentProjectId = updates.currentProjectId;
      if (updates.completedTasks) fields.completedTasks = JSON.stringify(updates.completedTasks);
      if (updates.activeFiles) fields.activeFiles = JSON.stringify(updates.activeFiles);
      if (updates.nextActions) fields.nextActions = JSON.stringify(updates.nextActions);
      if (updates.openQuestions) fields.openQuestions = JSON.stringify(updates.openQuestions);
      if (updates.sessionLog) fields.sessionLog = JSON.stringify(updates.sessionLog);

      const record = await this.base(TABLES.WORKING_CONTEXT).update(records[0].id, fields);

      // Invalidate cache
      this.cache.invalidate(`context:${this.config.userId}:current`);

      return this.recordToWorkingContext(record);
    });
  }

  /**
   * Converts Airtable record to WorkingContext
   */
  private recordToWorkingContext(record: Airtable.Record<FieldSet>): WorkingContext {
    return {
      id: parseInt(record.get('id') as string),
      userId: record.get('userId') as string,
      weekStart: new Date(record.get('weekStart') as string),
      primaryFocus: record.get('primaryFocus') as string | undefined,
      currentProjectId: record.get('currentProjectId') as number | undefined,
      completedTasks: this.parseJson(record.get('completedTasks') as string, []),
      activeFiles: this.parseJson(record.get('activeFiles') as string, []),
      nextActions: this.parseJson(record.get('nextActions') as string, []),
      openQuestions: this.parseJson(record.get('openQuestions') as string, []),
      sessionLog: this.parseJson(record.get('sessionLog') as string, []),
      isActive: record.get('isActive') as boolean,
      createdAt: this.parseDate(record.get('createdAt') as string),
      updatedAt: this.parseDate(record.get('updatedAt') as string),
    };
  }

  // ==========================================================================
  // Session Methods
  // ==========================================================================

  /**
   * Creates a new session
   */
  async createSession(
    session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Session> {
    return this.withRetry(async () => {
      const fields: FieldSet = {
        userId: session.userId,
        projectId: session.projectId,
        sessionStart: session.sessionStart.toISOString(),
        sessionEnd: session.sessionEnd?.toISOString(),
        summary: session.summary,
        tasksCompleted: session.tasksCompleted ? JSON.stringify(session.tasksCompleted) : undefined,
        filesModified: session.filesModified ? JSON.stringify(session.filesModified) : undefined,
        notes: session.notes,
      };

      const record = await this.base(TABLES.SESSIONS).create(fields);
      return this.recordToSession(record);
    });
  }

  /**
   * Updates a session
   */
  async updateSession(sessionId: number, updates: Partial<Session>): Promise<Session> {
    return this.withRetry(async () => {
      // Find the record
      const records = await this.base(TABLES.SESSIONS)
        .select({
          filterByFormula: `{id} = ${sessionId}`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const fields: FieldSet = {};
      if (updates.sessionEnd) fields.sessionEnd = updates.sessionEnd.toISOString();
      if (updates.summary) fields.summary = updates.summary;
      if (updates.tasksCompleted) fields.tasksCompleted = JSON.stringify(updates.tasksCompleted);
      if (updates.filesModified) fields.filesModified = JSON.stringify(updates.filesModified);
      if (updates.notes) fields.notes = updates.notes;

      const record = await this.base(TABLES.SESSIONS).update(records[0].id, fields);
      return this.recordToSession(record);
    });
  }

  /**
   * Lists sessions with optional filtering
   */
  async listSessions(query?: SessionQuery): Promise<PaginatedResponse<Session>> {
    return this.withRetry(async () => {
      let formula = `{userId} = '${this.config.userId}'`;

      if (query?.projectId) {
        formula += ` AND {projectId} = ${query.projectId}`;
      }

      const records = await this.base(TABLES.SESSIONS)
        .select({
          filterByFormula: `AND(${formula})`,
          sort: [{ field: 'sessionStart', direction: 'desc' }],
          maxRecords: query?.limit || 100,
        })
        .firstPage();

      const sessions = records.map(this.recordToSession.bind(this));

      return {
        data: sessions,
        total: sessions.length,
        limit: query?.limit || 100,
        offset: query?.offset || 0,
        hasMore: false,
      };
    });
  }

  /**
   * Converts Airtable record to Session
   */
  private recordToSession(record: Airtable.Record<FieldSet>): Session {
    return {
      id: parseInt(record.get('id') as string),
      userId: record.get('userId') as string,
      projectId: record.get('projectId') as number | undefined,
      sessionStart: new Date(record.get('sessionStart') as string),
      sessionEnd: this.parseDate(record.get('sessionEnd') as string),
      duration: record.get('duration') as number | undefined,
      summary: record.get('summary') as string | undefined,
      tasksCompleted: this.parseJson(record.get('tasksCompleted') as string, []),
      filesModified: this.parseJson(record.get('filesModified') as string, []),
      notes: record.get('notes') as string | undefined,
      createdAt: this.parseDate(record.get('createdAt') as string),
      updatedAt: this.parseDate(record.get('updatedAt') as string),
    };
  }
}
