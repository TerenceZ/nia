import Vue from "vue";
let context = null;
export function getContext() {
    return context;
}
export function setContext(ctx) {
    context = ctx;
    return context;
}
export function createDefaultContext() {
    return {
        mutations: {},
        actions: {},
        services: [],
        subs: [],
        vm: new Vue(),
        strict: false,
        // runtime is setup from init().
        runtime: {
            store: null,
            chan: null
        }
    };
}
