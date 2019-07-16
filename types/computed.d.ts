import { ValueWrapper } from "./value";
export interface ComputedOptions<T = any> {
    get: () => T;
    set?: (value: T) => void;
}
/**
 * Define a computed value wrapper.
 */
export declare function computed<T>(get: () => T, set?: (value: T) => void): ValueWrapper<T>;
/**
 * Define computed from map.
 */
export declare function computedMap<T extends Record<string, (() => any) | ComputedOptions>>(map: T): {
    [K in keyof T]: T[K] extends () => infer P ? ValueWrapper<P> : T[K] extends ComputedOptions<infer P> ? ValueWrapper<P> : never;
};
export declare function isComputed(value: any): any;
export declare function isComputedGetter(value: any): any;
