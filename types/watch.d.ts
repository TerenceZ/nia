import { ValueWrapper } from "./value";
export declare type WacthCallback<T = any> = (value: T, prevValue: T, onCleanup: (cb: () => void) => void) => any;
export declare type Watchable<T = any> = ValueWrapper<T> | (() => T);
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
    flush?: "sync";
}
/**
 * Watch a target and react on its changes.
 */
export declare function watch<T>(target: Watchable, cb: WacthCallback<T>, opts?: WatchOptions): () => void;
export declare function watch<T extends readonly Watchable[]>(target: T, cb: WacthCallback<UnwrapWatchableList<Writable<T>>>, opts?: WatchOptions): () => void;
export declare function watch<T extends Watchable[]>(target: T, cb: WacthCallback<UnwrapWatchableList<T>>, opts?: WatchOptions): () => void;
