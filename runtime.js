import { Store } from "vuex";
import { merge, map, mapKeys, mapValues, uniqueId, forOwn, isFunction, keys, intersection, forEach, reduce, filter, concat, noop, isArray, reverse, compact, assign, pick } from "lodash";
import { stdChannel, END, runSaga } from "redux-saga";
import { fork, all, take } from "redux-saga/effects";
import assert from "assert";
function isGeneratorFunction(fn) {
    return Object.prototype.toString.call(fn) === "[object GeneratorFunction]";
}
function createIO(store, channel) {
    return {
        channel,
        dispatch: createModelDispatcher(process.env.NODE_ENV !== "production" ? "root" : "", store)
    };
}
function createModelDispatcher(namespace, store) {
    const fn = (action) => store.dispatch(action);
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(fn, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: `model/dispach:${namespace}`
        });
    }
    return fn;
}
function createActionDispatcher(store, type) {
    const fn = (payload) => store.dispatch({ type, payload });
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(fn, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: `action/dispatch:${type}`
        });
    }
    return fn;
}
function createEffectsStoreActions(effects, keyMap, context) {
    const dispatcher = (store_, action) => {
        context.c.put(action);
    };
    return reduce(keyMap, (actions, key, name) => {
        let fn;
        if (isGeneratorFunction(effects[name])) {
            fn =
                process.env.NODE_ENV !== "production"
                    ? createSagaDispatcher(context, `effect/dispatch:${key}`)
                    : dispatcher;
        }
        else {
            fn = wrapEffect(effects[name], context, key);
        }
        actions[key] = fn;
        return actions;
    }, {});
}
function createServicesStoreActions(keyMap, context) {
    const dispatcher = (store_, action) => {
        context.c.put(action);
    };
    return reduce(keyMap, (actions, key) => {
        actions[key] =
            process.env.NODE_ENV !== "production"
                ? createSagaDispatcher(context, `service/dispatch:${key}`)
                : dispatcher;
        return actions;
    }, {});
}
function createMutationEffect(name, type, context) {
    const fn = (store, action) => {
        store.commit(type, action.payload);
        context.c.put(action);
    };
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(fn, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: `mutation/effect:${name}`
        });
    }
    return fn;
}
function createMutationsStoreActions(effectKeyMap, mutationKeyMap, context) {
    return mapKeys(mapValues(mutationKeyMap, (mutationKey, name) => createMutationEffect(name, mutationKey, context)), (fn_, name) => effectKeyMap[name]);
}
function createActionEffect(name, type, context) {
    const fn = (store, action) => {
        context.c.put(action);
    };
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(fn, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: `action/effect:${name}`
        });
    }
    return fn;
}
function createActionsStoreActions(keyMap, context) {
    return mapKeys(mapValues(keyMap, (key, name) => createActionEffect(name, key, context)), (fn_, name) => keyMap[name]);
}
function wrapGetter(fn, context, name) {
    const wrapped = () => fn.call(context.m, context.m);
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(wrapped, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: `getter:${name}`
        });
    }
    return wrapped;
}
function wrapMutation(fn, context, name) {
    const wrapped = (state_, payload) => fn.call(context.m, context.m, payload);
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(wrapped, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: `mutation:${name}`
        });
    }
    return wrapped;
}
function wrapEffect(fn, context, name) {
    const wrapped = (store_, action) => {
        const res = fn.call(context.m, context.m, action.payload);
        context.c.put(action);
        return res;
    };
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(wrapped, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: `effect:${name}`
        });
    }
    return wrapped;
}
function createSagaDispatcher(context, name) {
    const dispatcher = (vctx_, action) => {
        context.c.put(action);
    };
    if (process.env.NODE_ENV !== "production" && name) {
        Object.defineProperty(dispatcher, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: name
        });
    }
    return dispatcher;
}
function createModelSagas(services, effects, keyMap) {
    return concat(map(effects, (effect, name) => [keyMap[name], effect]), map(services, service => [null, service]));
}
function wrapForkSaga(saga, context, key) {
    const wrapped = (action) => fork([context.m, saga], context.m, action.payload);
    if (process.env.NODE_ENV !== "production" && (key || saga.name)) {
        Object.defineProperty(wrapped, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: `saga/fork:${key || saga.name}`
        });
    }
    return wrapped;
}
function* noeff() {
    // do nothing.
}
function combineSubscriptions(subs) {
    subs = filter(subs, sub => sub !== noop);
    if (!subs.length) {
        return noop;
    }
    if (subs.length === 1) {
        return subs[0];
    }
    return () => {
        const unsubs = reverse(compact(map(subs, sub => sub())));
        return unsubs.length
            ? () => {
                forEach(unsubs, unsub => unsub());
            }
            : noop;
    };
}
function combineSagas(sagas, context) {
    sagas = filter(map(sagas, effect => {
        let fn;
        if (isArray(effect)) {
            const [type, eff] = effect;
            const fork = wrapForkSaga(eff, context, type);
            fn =
                type != null
                    ? function* () {
                        while (true) {
                            yield fork(yield take(type));
                        }
                    }
                    : function* () {
                        yield fork({});
                    };
            if (process.env.NODE_ENV !== "production") {
                Object.defineProperty(fn, "name", {
                    configurable: true,
                    enumerable: false,
                    writable: false,
                    value: `saga/daemon:${type || eff.name || uniqueId("service")}`
                });
            }
        }
        else {
            fn = effect;
        }
        return fn;
    }), saga => saga !== noeff);
    if (!sagas.length) {
        return noeff;
    }
    if (sagas.length === 1) {
        return sagas[0];
    }
    return function* saga() {
        yield all(map(sagas, saga => saga()));
    };
}
// API declaration
let bootstrap;
let init;
let hotReload;
let model;
// API: bootstrap()
bootstrap = (factory, options = {}) => {
    const store = init(factory, pick(options, ["plugins", "strict", "services"]));
    let unsub;
    let stopped = false;
    store.stop = () => {
        if (process.env.NODE_ENV !== "production") {
            if (stopped) {
                throw new Error("[PANIC] Cannot invoke RootModel::stop() more than once.");
            }
        }
        stopped = true;
        if (unsub) {
            unsub();
        }
        store.io.channel.put(END);
    };
    store.hotReload = (nextFactory) => {
        store.stop();
        stopped = false;
        hotReload(store, nextFactory);
        runSaga(assign({}, store.io, options.saga), store.service);
        unsub = store.subscribe();
    };
    runSaga(assign({}, store.io, options.saga), store.saga);
    unsub = store.subscribe();
    return store;
};
// API: init()
init = (factory, options = {}) => {
    const { store: storeOptions, bind } = factory.configure();
    const store = new Store(assign({
        plugins: options.plugins,
        strict: options.strict
    }, storeOptions));
    const channel = stdChannel();
    const model = bind({
        namespace: [],
        services: options.services,
        state: store.state,
        store,
        channel
    });
    model.store = store;
    model.io = createIO(store, channel);
    return model;
};
// API: hotReload()
hotReload = (model, factory, options = {}) => {
    const { store: storeOptions, bind } = factory.configure();
    const channel = stdChannel();
    model.store.hotUpdate(storeOptions);
    const nextModel = bind({
        namespace: [],
        services: options.services,
        state: model.store.state,
        store: model.store,
        channel
    });
    model.actions = nextModel.actions;
    model.getters = nextModel.getters;
    model.saga = nextModel.saga;
    model.subscribe = nextModel.subscribe;
    model.dispatch = nextModel.dispatch;
    model.io = createIO(model.store, channel);
};
// API: model()
model = (options => {
    let prefix = "";
    if (process.env.NODE_ENV != "production") {
        prefix = options.__prefix;
    }
    const modules = options.modules;
    // name creator.
    const nameCreator = (category) => (_, key) => process.env.NODE_ENV !== "production"
        ? `${category || ""}${prefix}/${key}`
        : uniqueId();
    // Generate getter keys.
    const getters = options.getters;
    const getterKeyMap = mapValues(getters, nameCreator());
    // Generate action action keys.
    const actionsActionKeyMap = mapValues((options.actions || {}), nameCreator(process.env.NODE_ENV !== "production" ? "action/action:" : ""));
    // Generate mutation action keys.
    const mutations = options.mutations;
    const mutationActionKeyMap = mapValues(mutations, nameCreator(process.env.NODE_ENV !== "production" ? "mutation:" : ""));
    // Generate mutation effects.
    const mutationEffectActionKeyMap = mapValues(mutations, nameCreator(process.env.NODE_ENV !== "production" ? "action/mutation:" : ""));
    // Generate effect action keys from effects and mutatons.
    const effects = options.effects;
    const effectActionKeyMap = mapValues(effects, nameCreator(process.env.NODE_ENV !== "production" ? "action/effect:" : ""));
    // Resolve sagas.
    const sagas = [];
    forOwn(options.sagas, (fn) => {
        let wrapper = fn;
        if (process.env.NODE_ENV !== "production") {
            wrapper = function (...args) {
                return fn.apply(this, args);
            };
            Object.defineProperty(wrapper, "name", {
                configurable: true,
                writable: false,
                enumerable: false,
                value: nameCreator()(null, fn.name || uniqueId("service"))
            });
        }
        sagas.push(wrapper);
    });
    // Check if actions conflict.
    if (process.env.NODE_ENV !== "production") {
        const conflicts = intersection(keys(actionsActionKeyMap), keys(mutationEffectActionKeyMap), keys(effectActionKeyMap), keys(modules));
        assert(!conflicts.length, `[PANIC] name conflicts for effects, mutations and service actions under namespace "${prefix}":\n  ${conflicts}`);
    }
    // Create action creators.
    const actionCreators = merge(mapValues(merge({}, actionsActionKeyMap, mutationEffectActionKeyMap, effectActionKeyMap), type => {
        const fn = (payload) => ({
            type,
            payload
        });
        Object.defineProperty(fn, "toString", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: () => type
        });
        if (process.env.NODE_ENV !== "production") {
            Object.defineProperty(fn, "name", {
                configurable: true,
                enumerable: false,
                writable: false,
                value: `action:${type}`
            });
        }
        return fn;
    }), mapValues(modules, module => module.actions_));
    // Sucribe.
    const subs = [];
    const subscribe = (sub) => {
        subs.push(sub);
    };
    // Configure
    const configure = (() => {
        const context = {};
        // Generate store getters.
        const storeGetters = mapKeys(mapValues(getterKeyMap, (key, name) => wrapGetter(getters[name], context, key)), (getter_, name) => getterKeyMap[name]);
        // Generate store mutations.
        const storeMutations = mapKeys(mapValues(mutationActionKeyMap, (key, name) => wrapMutation(mutations[name], context, key)), (mutation_, name) => mutationActionKeyMap[name]);
        // Generate store actions from effects.
        const storeActions = createEffectsStoreActions(effects, effectActionKeyMap, context);
        // Generate store actions from mutation effects.
        merge(storeActions, createMutationsStoreActions(mutationEffectActionKeyMap, mutationActionKeyMap, context), createActionsStoreActions(actionsActionKeyMap, context));
        // Generate store modules.
        const moduleConfigs = mapValues(modules, module => module.configure());
        const storeModules = mapValues(moduleConfigs, ({ store }) => store);
        const data = options.data;
        return {
            // The config for store.
            store: {
                state: options.state,
                getters: storeGetters,
                mutations: storeMutations,
                actions: storeActions,
                modules: storeModules
            },
            bind({ namespace, store, state, channel, services }) {
                context.c = channel;
                // Bind modules.
                const modelModules = mapValues(moduleConfigs, ({ bind }, key) => bind({
                    namespace: [...namespace, key],
                    store,
                    state: state[key],
                    channel,
                    services
                }));
                // Create model getters.
                const modelGetters = reduce(getterKeyMap, (getters, key, name) => {
                    const descriptor = Object.getOwnPropertyDescriptor(store.getters, key);
                    if (process.env.NODE_ENV !== "production") {
                        assert(descriptor, `[PANIC] Failed to get property "${key}" from store.`);
                    }
                    Object.defineProperty(getters, name, descriptor);
                    return getters;
                }, mapValues(modelModules, model => model.getters));
                // Create model dispatcher.
                const dispatch = createModelDispatcher(prefix, store);
                // Attach mutation effect actions.
                forOwn(mutationEffectActionKeyMap, (key, name) => {
                    dispatch[name] = createActionDispatcher(store, key);
                });
                // Attach effect actions.
                forOwn(effectActionKeyMap, (key, name) => {
                    dispatch[name] = createActionDispatcher(store, key);
                });
                // Attach module actions.
                forOwn(modelModules, (model, name) => {
                    dispatch[name] = model.dispatch;
                });
                // Create model sub list, modules' first.
                const modelSubscription = combineSubscriptions(concat(map(modelModules, model => model.subscribe), map(subs, sub => () => sub(context.m))));
                // Create model service.
                const modelService = combineSagas(concat(map(modelModules, model => model.saga), createModelSagas(sagas, effects, effectActionKeyMap)), context);
                return (context.m = {
                    namespace,
                    services,
                    // for sub context.
                    onStoreCommit(fn) {
                        return store.subscribe(fn);
                    },
                    onStoreDispatch(fn) {
                        return store.subscribeAction(fn);
                    },
                    watch(getter, cb, options) {
                        return store.watch(getter, cb, options);
                    },
                    // model state.
                    state: state,
                    // model dispatch.
                    dispatch: dispatch,
                    // model data.
                    data: isFunction(data) ? data() : data || {},
                    // model actions.
                    actions: actionCreators,
                    // model getters.
                    getters: modelGetters,
                    // model service.
                    saga: modelService,
                    // model subscription.
                    subscribe: modelSubscription
                });
            }
        };
    });
    // Config object
    const config = {
        actions_: actionCreators,
        configure: configure,
        subscribe(sub) {
            subscribe(sub);
            return config;
        }
    };
    return config;
});
export { bootstrap, init, hotReload, model };
