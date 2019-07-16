import { Saga, MulticastChannel } from "redux-saga";
import Vue from "vue";
import { Store } from "vuex";

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

let context: Context = null!;

export function getContext() {
  return context;
}

export function setContext(ctx: Context) {
  context = ctx;
  return context;
}

export function createDefaultContext(): Context {
  return {
    mutations: {},
    actions: {},
    services: [],
    subs: [],
    vm: new Vue(),
    strict: false,

    // runtime is setup from init().
    runtime: {
      store: null!,
      chan: null!
    }
  };
}
