export declare const VALUE_TAG: unique symbol;
export declare const VALUE_GETTER_TAG: unique symbol;
export interface ValueWrapper<T> {
    [VALUE_TAG]: true;
    value: T;
}
/**
 * Define a reactive value wrapper.
 */
export declare function value<T = any>(): ValueWrapper<T | undefined>;
export declare function value<T>(initial: T): ValueWrapper<T>;
export declare function isValue(value: any): value is ValueWrapper<any>;
export declare function isValueGetter(value: any): any;
