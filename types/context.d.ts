import { Saga, MulticastChannel } from 'redux-saga';
import Vue from 'vue';
import { Store } from 'vuex';
export interface Context {
    actions: Record<string, (_: any, payload: any) => any>;
    mutations: Record<string, (state: any, payload: any) => void>;
    services: Saga<[]>[];
    subs: (() => any)[];
    strict: boolean;
    vm: Vue;
    runtime: Runtime;
}
export interface Runtime {
    store: Store<any>;
    chan: MulticastChannel<any>;
}
export declare function getContext(): Context;
export declare function setContext(ctx: Context): Context;
export declare function createDefaultContext(): Context;
