import { ValueWrapper } from './value';
export interface WacthCallback<T, R> {
    (value: T, prevValue: T | undefined, onCleanup: (cb: () => void) => void): R;
}
export declare type Watchable<T> = ValueWrapper<T> | (() => T);
export declare type UnwrapWatchable<T> = T extends Watchable<infer V> ? V : never;
export declare type UnwrapWatchableList<T extends any[]> = {
    readonly [K in keyof T]: UnwrapWatchable<T[K]>;
};
export declare type Writable<T> = {
    -readonly [K in keyof T]: T[K];
};
export interface WatchOptions {
    lazy?: boolean;
    deep?: boolean;
    flush?: 'sync';
}
/**
 * Watch a target and react on its changes.
 */
export declare function watch<T, R>(target: Watchable<T>, cb: WacthCallback<T, R>, opts?: WatchOptions): () => void;
export declare function watch<T extends readonly Watchable<any>[], R>(target: T, cb: WacthCallback<UnwrapWatchableList<Writable<T>>, R>, opts?: WatchOptions): () => void;
export declare function watch<T extends Watchable<any>[], R>(target: T, cb: WacthCallback<UnwrapWatchableList<T>, R>, opts?: WatchOptions): () => void;
