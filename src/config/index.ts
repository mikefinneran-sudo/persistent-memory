/**
 * Configuration management for Persistent Memory System
 */

import * as dotenv from 'dotenv';
import { ClientConfig, CacheConfig } from '../types';

// Load environment variables
dotenv.config();

/**
 * Validates required environment variables
 */
function validateEnv(): void {
  const required = ['AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID', 'USER_ID'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please copy .env.example to .env and fill in the required values.'
    );
  }
}

/**
 * Default cache configuration
 */
const defaultCacheConfig: CacheConfig = {
  enabled: true,
  ttl: 300, // 5 minutes
  maxSize: 100,
};

/**
 * Gets the client configuration from environment variables
 */
export function getConfig(): ClientConfig {
  validateEnv();

  return {
    apiKey: process.env.AIRTABLE_API_KEY!,
    baseId: process.env.AIRTABLE_BASE_ID!,
    userId: process.env.USER_ID!,
    cache: {
      ...defaultCacheConfig,
      enabled: process.env.CACHE_ENABLED !== 'false',
      ttl: parseInt(process.env.CACHE_TTL || '300'),
      maxSize: parseInt(process.env.CACHE_MAX_SIZE || '100'),
    },
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.RETRY_DELAY || '1000'),
  };
}

/**
 * Creates a custom client configuration
 */
export function createConfig(overrides: Partial<ClientConfig>): ClientConfig {
  const defaultConfig = getConfig();
  return {
    ...defaultConfig,
    ...overrides,
    cache: {
      ...defaultConfig.cache,
      ...(overrides.cache || {}),
    },
  };
}

/**
 * Table names in Airtable base
 */
export const TABLES = {
  USERS: 'Users',
  PROJECTS: 'Projects',
  PROJECT_CONTENT: 'ProjectContent',
  WORKING_CONTEXT: 'WorkingContext',
  SESSIONS: 'Sessions',
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];
