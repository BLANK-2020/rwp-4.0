/**
 * Caching Utilities
 *
 * This module provides functions for caching frequently accessed data.
 * It includes in-memory caching for performance optimization.
 */

// Define the cache item
interface CacheItem<T> {
  value: T
  expires: number
}

// Define the cache options
export interface CacheOptions {
  ttl: number // Time to live in seconds
  maxSize: number // Maximum number of items in the cache
}

// Define the default cache options
const defaultCacheOptions: CacheOptions = {
  ttl: 60 * 5, // 5 minutes
  maxSize: 1000,
}

// Create a singleton instance of the cache
class MemoryCache {
  private static instance: MemoryCache
  private options: CacheOptions
  private cache: Map<string, CacheItem<any>>

  private constructor(options: CacheOptions) {
    this.options = options
    this.cache = new Map()
  }

  /**
   * Get the cache instance
   * @param options The cache options
   * @returns The cache instance
   */
  public static getInstance(options?: Partial<CacheOptions>): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache({
        ...defaultCacheOptions,
        ...options,
      })
    }

    return MemoryCache.instance
  }

  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Optional TTL in seconds (overrides the default)
   */
  public set<T>(key: string, value: T, ttl?: number): void {
    const expiresIn = ttl || this.options.ttl
    const expires = Date.now() + expiresIn * 1000

    // Set the value in the cache
    this.cache.set(key, { value, expires })

    // Enforce the maximum cache size
    if (this.cache.size > this.options.maxSize) {
      // Get the first key from the cache
      const keys = Array.from(this.cache.keys())
      if (keys.length > 0) {
        // Remove the oldest item (first key)
        this.cache.delete(keys[0])
      }
    }
  }

  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value or null if not found
   */
  public get<T>(key: string): T | null {
    // Get the value from the cache
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // Check if the item has expired
    if (item.expires < Date.now()) {
      this.cache.delete(key)
      return null
    }

    return item.value as T
  }

  /**
   * Delete a value from the cache
   * @param key The cache key
   */
  public delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear the entire cache
   */
  public clear(): void {
    this.cache.clear()
  }

  /**
   * Get a value from the cache or compute it if not found
   * @param key The cache key
   * @param compute A function that computes the value if not found in the cache
   * @param ttl Optional TTL in seconds (overrides the default)
   * @returns The cached value or the computed value
   */
  public getOrCompute<T>(key: string, compute: () => T, ttl?: number): T {
    // Try to get the value from the cache
    const cachedValue = this.get<T>(key)

    if (cachedValue !== null) {
      return cachedValue
    }

    // Compute the value
    const computedValue = compute()

    // Cache the computed value
    this.set(key, computedValue, ttl)

    return computedValue
  }

  /**
   * Get a value from the cache or compute it if not found (async version)
   * @param key The cache key
   * @param compute A function that computes the value if not found in the cache
   * @param ttl Optional TTL in seconds (overrides the default)
   * @returns A promise that resolves to the cached value or the computed value
   */
  public async getOrComputeAsync<T>(
    key: string,
    compute: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Try to get the value from the cache
    const cachedValue = this.get<T>(key)

    if (cachedValue !== null) {
      return cachedValue
    }

    // Compute the value
    const computedValue = await compute()

    // Cache the computed value
    this.set(key, computedValue, ttl)

    return computedValue
  }
}

// Initialize the cache with default options
export const cache = MemoryCache.getInstance()

/**
 * Cache a function call
 * @param fn The function to cache
 * @param keyPrefix The prefix for the cache key
 * @param ttl Optional TTL in seconds (overrides the default)
 * @returns A function that returns the cached result
 */
export function cachify<T, Args extends any[]>(
  fn: (...args: Args) => T,
  keyPrefix: string,
  ttl?: number,
): (...args: Args) => T {
  return (...args: Args): T => {
    // Generate a cache key based on the function arguments
    const key = `${keyPrefix}:${JSON.stringify(args)}`

    // Get or compute the value
    return cache.getOrCompute(key, () => fn(...args), ttl)
  }
}

/**
 * Cache an async function call
 * @param fn The async function to cache
 * @param keyPrefix The prefix for the cache key
 * @param ttl Optional TTL in seconds (overrides the default)
 * @returns A function that returns a promise that resolves to the cached result
 */
export function cachifyAsync<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  keyPrefix: string,
  ttl?: number,
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    // Generate a cache key based on the function arguments
    const key = `${keyPrefix}:${JSON.stringify(args)}`

    // Get or compute the value
    return cache.getOrComputeAsync(key, () => fn(...args), ttl)
  }
}
