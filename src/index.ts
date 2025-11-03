/**
 * Persistent Memory System - Airtable Backend
 *
 * Main entry point for the SDK
 */

// Export main client
export { MemoryClient } from './services/memory-client';
export { AirtableService } from './services/airtable';

// Export prompting rules (NEW in v2.1)
export { CommandParser } from './services/command-parser';
export { ContextEngine } from './services/context-engine';
export { RulesClient } from './services/rules-client';
export { SessionInitializer } from './services/session-initializer';

// Export configuration
export { getConfig, createConfig, TABLES } from './config';

// Export all types
export * from './types';
export * from './types/prompting-rules';

// Export utilities
export { Cache } from './utils/cache';
export { retry, isRetryableError } from './utils/retry';
