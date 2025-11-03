/**
 * Type definitions for the Persistent Memory System
 */

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id?: number;
  userId: string;
  name: string;
  email: string;
  useCase?: string;
  communicationStyle?: string;
  fileConventions?: string;
  workflowPrinciples?: string;
  defaultLocations?: Record<string, string>;
  preferences?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserPreferences {
  communicationStyle?: string;
  fileConventions?: string;
  workflowPrinciples?: string;
  defaultLocations?: Record<string, string>;
  [key: string]: any;
}

// ============================================================================
// Project Types
// ============================================================================

export type ProjectStatus =
  | 'Active'
  | 'Planning'
  | 'Research'
  | 'Paused'
  | 'Completed'
  | 'Archived';

export type ProjectPriority = 'High' | 'Medium' | 'Low';

export interface Project {
  id?: number;
  userId: string;
  projectName: string;
  displayName: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  location?: string;
  tags?: string[];
  startDate?: Date;
  lastAccessedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectWithContent extends Project {
  content: ProjectContent[];
}

// ============================================================================
// Project Content Types
// ============================================================================

export type ContentType =
  | 'README'
  | 'PROJECT'
  | 'STATUS'
  | 'BACKLOG'
  | 'QUICKREF'
  | 'DECISIONS'
  | 'NOTES'
  | 'CUSTOM';

export interface ProjectContent {
  id?: number;
  projectId: number;
  contentType: ContentType;
  customType?: string;
  content: string;
  version: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectContentUpdate {
  projectId: number;
  contentType: ContentType;
  content: string;
  customType?: string;
}

// ============================================================================
// Working Context Types
// ============================================================================

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
}

export interface FileLocation {
  path: string;
  description?: string;
}

export interface NextAction {
  id: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export interface OpenQuestion {
  id: string;
  question: string;
  context?: string;
}

export interface SessionNote {
  timestamp: Date;
  note: string;
  projectId?: number;
}

export interface WorkingContext {
  id?: number;
  userId: string;
  weekStart: Date;
  primaryFocus?: string;
  currentProjectId?: number;
  completedTasks?: Task[];
  activeFiles?: FileLocation[];
  nextActions?: NextAction[];
  openQuestions?: OpenQuestion[];
  sessionLog?: SessionNote[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkingContextUpdate {
  primaryFocus?: string;
  currentProjectId?: number;
  completedTasks?: Task[];
  activeFiles?: FileLocation[];
  nextActions?: NextAction[];
  openQuestions?: OpenQuestion[];
  sessionLog?: SessionNote[];
}

// ============================================================================
// Session Types
// ============================================================================

export interface Session {
  id?: number;
  userId: string;
  projectId?: number;
  sessionStart: Date;
  sessionEnd?: Date;
  duration?: number; // in minutes
  summary?: string;
  tasksCompleted?: Task[];
  filesModified?: string[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SessionCreate {
  userId: string;
  projectId?: number;
  sessionStart?: Date;
  summary?: string;
}

export interface SessionUpdate {
  sessionEnd?: Date;
  summary?: string;
  tasksCompleted?: Task[];
  filesModified?: string[];
  notes?: string;
}

// ============================================================================
// Query Types
// ============================================================================

export interface ProjectQuery {
  userId: string;
  status?: ProjectStatus | ProjectStatus[];
  priority?: ProjectPriority;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface SessionQuery {
  userId: string;
  projectId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AirtableConfig {
  apiKey: string;
  baseId: string;
  userId: string;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // in seconds
  maxSize: number; // max number of cached items
}

export interface ClientConfig extends AirtableConfig {
  cache?: CacheConfig;
  retryAttempts?: number;
  retryDelay?: number; // in milliseconds
}
