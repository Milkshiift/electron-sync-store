import type { StoreOptions } from "./types";
/**
 * Type helper for defining store configuration with type inference.
 */
export declare function defineStore<T>(config: StoreOptions<T>): StoreOptions<T>;
/**
 * deeply clones a value using structuredClone (modern) or JSON fallback.
 */
export declare function clone<T>(data: T): T;
/**
 * Deep merges a partial source object into a target object.
 * Handles recursion, Arrays, Dates, and RegExps.
 * Returns a new object reference (immutable).
 */
export declare function deepMerge<T>(target: T, source: unknown): T;
