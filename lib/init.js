import { getContext, createDefaultContext, setContext } from "./context";
import { Store as VuexStore } from "vuex";
import { stdChannel, runSaga } from "redux-saga";
import { unwrap, isValue, isValueGetter } from "./value";
import assert from "assert";
import { isPlainObject, assign, bind, flowRight, map } from "lodash";
import { isComputed, isComputedGetter } from "./computed";
import { all } from "redux-saga/effects";
import { noop } from "./utils";
/**
 * Init a module.
 */
export function init(mod, options = {}) {
    if (process.env.NODE_ENV !== "production") {
        assert(!getContext(), `[PANIC] Failed to invoke init() cannot because another init() is being called.`);
    }
    try {
        const context = setContext((options.context && options.context()) || createDefaultContext());
        context.strict = !!options.strict;
        // Initialize module.
        const instance = mod();
        // Create a vuex store to act as an event emitter,
        // and expose things on devtool.
        const vstore = new VuexStore({
            ...extractStoreOptionsFromModule(instance),
            actions: context.actions,
            mutations: context.mutations,
            plugins: options.plugins
        });
        // Init runtime.
        const chan = stdChannel();
        const runtime = context.runtime;
        runtime.chan = chan;
        runtime.store = vstore;
        // Run context actions.
        const stopActions = runContextActions(context, options);
        // Inject extra props.
        const vm = context.vm;
        const store = unwrap(instance);
        store.$store = vstore;
        store.$stop = () => {
            store.$stop = noop;
            stopActions();
            vm.$destroy();
        };
        store.$reload = createHotReload(store, options);
        return store;
    }
    finally {
        setContext(null);
    }
}
function extractStoreOptionsFromModule(mod) {
    const state = {};
    const getters = {};
    if (process.env.NODE_ENV !== "production") {
        const walk = (obj, path) => {
            for (const prop in obj) {
                if (Reflect.has(obj, prop)) {
                    const descriptor = Reflect.getOwnPropertyDescriptor(obj, prop);
                    const key = path.length ? `${path.join("/")}/${prop}` : prop;
                    if (!descriptor.get) {
                        const value = descriptor.value;
                        if (value) {
                            if (isComputed(value)) {
                                getters[key] = Reflect.getOwnPropertyDescriptor(value, "value").get;
                            }
                            else if (isValue(value)) {
                                Reflect.defineProperty(state, key, Reflect.getOwnPropertyDescriptor(value, "value"));
                            }
                            else if (value.__ob__) {
                                Reflect.defineProperty(state, key, descriptor);
                            }
                            else if (isPlainObject(value)) {
                                walk(value, [...path, prop]);
                            }
                        }
                    }
                    else if (isComputedGetter(descriptor.get)) {
                        getters[key] = descriptor.get;
                    }
                    else if (isValueGetter(descriptor.get)) {
                        Reflect.defineProperty(state, key, descriptor);
                    }
                }
            }
        };
        walk(mod, []);
    }
    return { state, getters };
}
function runContextActions(context, options) {
    const runtime = context.runtime;
    // Start sagas.
    const task = runSaga(assign({
        channel: runtime.chan,
        dispatch: bind(runtime.store.dispatch, runtime.store)
    }, options.saga), createRootSaga(context.services));
    // Invoke subscriptions.
    const unsub = flowRight(context.subs.map(sub => sub() || noop));
    return () => {
        unsub();
        task.cancel();
    };
}
function createRootSaga(sagas) {
    return function* rootSaga() {
        yield all(map(sagas, saga => saga()));
    };
}
function createHotReload(store, options) {
    return (mod) => {
        if (process.env.NODE_ENV === "production") {
            return store;
        }
        try {
            store.$stop();
            const context = setContext((options.context && options.context()) || createDefaultContext());
            // Initialize module.
            const instance = mod();
            // Hot update store.
            store.$store.hotUpdate({
                ...extractStoreOptionsFromModule(instance),
                actions: context.actions,
                mutations: context.mutations
            });
            // Init runtime.
            const chan = stdChannel();
            const runtime = context.runtime;
            runtime.chan = chan;
            runtime.store = store.$store;
            // Run context actions.
            const stopActions = runContextActions(context, options);
            // Inject extra props.
            const vm = context.vm;
            const nextStore = unwrap(instance);
            // Copy new module props into store.
            for (const prop in nextStore) {
                if (Reflect.has(nextStore, prop)) {
                    Reflect.defineProperty(store, prop, Reflect.getOwnPropertyDescriptor(nextStore, prop));
                }
            }
            // Bind new stop.
            store.$stop = () => {
                store.$stop = noop;
                stopActions();
                vm.$destroy();
            };
            return store;
        }
        finally {
            setContext(null);
        }
    };
}
