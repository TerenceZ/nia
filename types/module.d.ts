/**
 * Use a module.
 */
export declare function module<A extends any[], T>(mod: (...args: A) => T, ...args: A): import("./value").Unwrap<T>;
