export declare const VALUE_TAG: unique symbol;
export declare const VALUE_GETTER_TAG: unique symbol;
export interface ValueWrapper<T> {
    [VALUE_TAG]: true;
    value: T;
}
export declare type Unwrap<T> = T extends ValueWrapper<infer V> ? V : T extends (...args: any) => any ? T : {
    [K in keyof T]: Unwrap<T[K]>;
};
/**
 * Define a reactive value wrapper.
 */
export declare function value<T = any>(): ValueWrapper<T | undefined>;
export declare function value<T>(initial: T): ValueWrapper<T>;
export declare function isValue(value: any): value is ValueWrapper<any>;
export declare function isValueGetter(value: any): any;
export declare function unwrap<T>(value: T, plain?: boolean): Unwrap<T>;
