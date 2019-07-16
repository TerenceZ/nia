import { Context } from "./context";
import { Store as VuexStore, Plugin } from "vuex";
import { RunSagaOptions } from "redux-saga";
import { Unwrap } from "./value";
export interface InitOptions<C extends Context = Context> {
    context?: () => C;
    plugins?: Plugin<any>[];
    strict?: boolean;
    saga?: RunSagaOptions<any, any>;
}
export interface StoreExtraProps<T> {
    $store: VuexStore<any>;
    $stop: () => void;
    $reload: (module: () => T) => Store<T>;
}
export declare type Store<T> = Unwrap<T> & StoreExtraProps<T>;
/**
 * Init a module.
 */
export declare function init<T extends object, C extends Context>(mod: () => T, options?: InitOptions<C>): Readonly<Store<T>>;
