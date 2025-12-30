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
 * Deep merges a partial source object into a target object.
 * Handles recursion, Arrays, Dates, and RegExps.
 * Returns a new object reference (immutable).
 */
export function deepMerge<T>(target: T, source: unknown): T {
    if (!isObject(source) || !isObject(target)) {
        return isObject(source) ? clone(source as any) : (source as T);
    }

    if (source instanceof Date) {
        return new Date(source.getTime()) as any;
    }
    if (source instanceof RegExp) {
        return new RegExp(source) as any;
    }

    if (Array.isArray(source)) {
        return clone(source) as any;
    }

    // If target is array/date/regexp but source is object, we overwrite, not merge.
    if (Array.isArray(target) || target instanceof Date || target instanceof RegExp) {
        return clone(source as any);
    }

    const result = { ...target } as any;

    for (const key of Object.keys(source)) {
        // Prevent prototype pollution
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
            continue;
        }

        const targetValue = result[key];
        const sourceValue = (source as any)[key];

        if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
            result[key] = deepMerge(targetValue, sourceValue);
        } else {
            result[key] = isObject(sourceValue) ? clone(sourceValue) : sourceValue;
        }
    }

    return result;
}


function isObject(item: unknown): item is object {
    return item !== null && typeof item === "object";
}

function isPlainObject(item: unknown): boolean {
    return (
        isObject(item) &&
        !Array.isArray(item) &&
        !(item instanceof Date) &&
        !(item instanceof RegExp)
    );
}