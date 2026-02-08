/**
 * Type Guards
 * 
 * Runtime type checking utilities for safe type narrowing.
 */

// ─── Null/Undefined Guards ──────────────────────────────────────────────────

/**
 * Check if a value is defined (not null or undefined).
 */
export function isDefined<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

/**
 * Check if a value is null or undefined.
 */
export function isNullish(value: unknown): value is null | undefined {
    return value === null || value === undefined;
}

// ─── Primitive Guards ───────────────────────────────────────────────────────

/**
 * Check if a value is a string.
 */
export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

/**
 * Check if a value is a number (and not NaN).
 */
export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Check if a value is a boolean.
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

/**
 * Check if a value is a function.
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
    return typeof value === 'function';
}

// ─── Object Guards ──────────────────────────────────────────────────────────

/**
 * Check if a value is a non-null object.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is an array.
 */
export function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

/**
 * Check if an object has a specific property.
 */
export function hasProperty<K extends string>(
    obj: unknown,
    key: K
): obj is Record<K, unknown> {
    return isObject(obj) && key in obj;
}

/**
 * Check if an object has all specified properties.
 */
export function hasProperties<K extends string>(
    obj: unknown,
    keys: K[]
): obj is Record<K, unknown> {
    return isObject(obj) && keys.every(key => key in obj);
}

// ─── Array Helpers ──────────────────────────────────────────────────────────

/**
 * Safely get the first element of an array.
 */
export function first<T>(arr: T[]): T | undefined {
    return arr[0];
}

/**
 * Safely get the last element of an array.
 */
export function last<T>(arr: T[]): T | undefined {
    return arr[arr.length - 1];
}

/**
 * Assert that a condition is true, or throw an error.
 */
export function assert(condition: unknown, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message ?? 'Assertion failed');
    }
}

/**
 * Assert that a value is defined.
 */
export function assertDefined<T>(
    value: T | null | undefined,
    message?: string
): asserts value is T {
    if (value === null || value === undefined) {
        throw new Error(message ?? 'Expected value to be defined');
    }
}
