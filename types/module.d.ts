/**
 * Use a module.
 */
export declare function module<A extends any[], T extends object>(mod: (...args: A) => T, ...args: A): import("./wrap").Unwrap<T>;
