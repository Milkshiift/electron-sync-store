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
 * Checks if a value is a plain object (not null, not array, not date, etc).
 */
export declare function isPlainObject(item: unknown): item is Record<string, any>;
/**
 * Deep merges a partial source object into a target object.
 * Handles recursion, Arrays, Dates, and RegExps.
 * Returns a new object reference (immutable).
 *
 * NOTE: Arrays are replaced, not merged.
 * NOTE: `undefined` values in source will delete the corresponding key in target.
 */
export declare function deepMerge<T>(target: T, source: any): T;
