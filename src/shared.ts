import type { StoreOptions } from "./types";

/**
 * Type helper for defining store configuration with type inference.
 */
export function defineStore<T>(config: StoreOptions<T>): StoreOptions<T> {
    return config;
}

/**
 * deeply clones a value using structuredClone (modern) or JSON fallback.
 */
export function clone<T>(data: T): T {
    try {
        return structuredClone(data);
    } catch (e) {
        return JSON.parse(JSON.stringify(data));
    }
}

/**
 * Checks if a value is a plain object (not null, not array, not date, etc).
 */
export function isPlainObject(item: unknown): item is Record<string, any> {
    return (
        item !== null &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        !(item instanceof Date) &&
        !(item instanceof RegExp)
    );
}

/**
 * Deep merges a partial source object into a target object.
 * Handles recursion, Arrays, Dates, and RegExps.
 * Returns a new object reference (immutable).
 *
 * NOTE: Arrays are replaced, not merged.
 * NOTE: `undefined` values in source will delete the corresponding key in target.
 */
export function deepMerge<T>(target: T, source: any): T {
    // If source is explicitly undefined, return undefined to signal deletion
    if (source === undefined) {
        return undefined as unknown as T;
    }

    // If either is not a plain object (e.g. Array, Date, null, primitive), source replaces target.
    if (!isPlainObject(target) || !isPlainObject(source)) {
        return clone(source);
    }

    const output = { ...target } as any;

    for (const key of Object.keys(source)) {
        // Prevent prototype pollution
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
            continue;
        }

        const sourceValue = source[key];
        const targetValue = output[key];

        if (sourceValue === undefined) {
            delete output[key];
        } else {
            // Recursively merge
            output[key] = deepMerge(targetValue, sourceValue);
        }
    }

    return output;
}