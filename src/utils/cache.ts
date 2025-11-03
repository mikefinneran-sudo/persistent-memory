/**
 * Simple in-memory cache with TTL support
 */

import { CacheConfig } from '../types';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class Cache {
  private cache: Map<string, CacheEntry<any>>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.config = config;
  }

  /**
   * Gets a value from the cache
   */
  get<T>(key: string): T | null {
    if (!this.config.enabled) {
      return null;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Sets a value in the cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    if (!this.config.enabled) {
      return;
    }

    // Enforce max size by removing oldest entries
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const effectiveTtl = (ttl || this.config.ttl) * 1000; // Convert to ms
    const expiresAt = Date.now() + effectiveTtl;

    this.cache.set(key, {
      data: value,
      expiresAt,
    });
  }

  /**
   * Invalidates a cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidates all cache entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  stats(): { size: number; maxSize: number; enabled: boolean } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      enabled: this.config.enabled,
    };
  }
}
