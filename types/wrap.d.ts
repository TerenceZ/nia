import { ValueWrapper } from './value';
export declare type Wrap<T> = {
    [K in keyof T]: T[K] extends ValueWrapper<any> ? T[K] : ValueWrapper<T[K]>;
};
export declare type Unwrap<T> = {
    [K in keyof T]: T[K] extends ValueWrapper<infer V> ? V : T[K];
};
export declare function wrap<T extends object>(value: T): {
    [K in keyof T]: T[K] extends ValueWrapper<any> ? T[K] : ValueWrapper<T[K]>;
};
export declare function unwrap<T extends object>(value: T): Unwrap<T>;
