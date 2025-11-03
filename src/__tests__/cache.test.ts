/**
 * Tests for Cache utility
 */

import { Cache } from '../utils/cache';
import { CacheConfig } from '../types';

describe('Cache', () => {
  let cache: Cache;
  let config: CacheConfig;

  beforeEach(() => {
    config = {
      enabled: true,
      ttl: 1, // 1 second for testing
      maxSize: 3,
    };
    cache = new Cache(config);
  });

  describe('get/set', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should handle different data types', () => {
      cache.set('string', 'test');
      cache.set('number', 42);
      cache.set('object', { foo: 'bar' });
      cache.set('array', [1, 2, 3]);

      expect(cache.get('string')).toBe('test');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('object')).toEqual({ foo: 'bar' });
      expect(cache.get('array')).toEqual([1, 2, 3]);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(cache.get('key1')).toBeNull();
    });

    it('should support custom TTL per entry', async () => {
      cache.set('key1', 'value1', 2); // 2 second TTL

      // Wait 1.5 seconds
      await new Promise((resolve) => setTimeout(resolve, 1500));

      expect(cache.get('key1')).toBe('value1');

      // Wait another 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(cache.get('key1')).toBeNull();
    });
  });

  describe('maxSize enforcement', () => {
    it('should evict oldest entries when max size reached', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('invalidate', () => {
    it('should invalidate single entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.invalidate('key1');

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should invalidate entries by pattern', () => {
      cache.set('user:1', 'user1');
      cache.set('user:2', 'user2');
      cache.set('project:1', 'project1');

      cache.invalidatePattern(/^user:/);

      expect(cache.get('user:1')).toBeNull();
      expect(cache.get('user:2')).toBeNull();
      expect(cache.get('project:1')).toBe('project1');
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });
  });

  describe('stats', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.stats();

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.enabled).toBe(true);
    });
  });

  describe('disabled cache', () => {
    it('should not cache when disabled', () => {
      const disabledCache = new Cache({ enabled: false, ttl: 300, maxSize: 100 });

      disabledCache.set('key1', 'value1');

      expect(disabledCache.get('key1')).toBeNull();
    });
  });
});
