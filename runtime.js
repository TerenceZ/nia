import { Store } from "vuex";
import { merge, map, mapKeys, mapValues, uniqueId, forOwn, isFunction, keys, intersection, forEach, reduce, concat, noop, compact, assign, pick, flowRight } from "lodash";
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
    const fn = (store_, action) => {
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
    const dispatcher = (s_, a) => {
        context.c.put(a);
    };
    return mapKeys(mapValues(keyMap, (key, name) => process.env.NODE_ENV !== "production"
        ? createActionEffect(name, key, context)
        : dispatcher), (fn_, name) => keyMap[name]);
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
function createActionWatcherSaga(saga, type) {
    const wrapped = function* (model) {
        while (true) {
            yield fork([model, saga], model, (yield take(type)).payload);
        }
    };
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(wrapped, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: `saga/fork:${type}`
        });
    }
    return wrapped;
}
function* noeff() {
    // do nothing.
}
function combineSubs(subs) {
    if (!subs.length) {
        return noop;
    }
    return () => flowRight(compact(map(subs, sub => sub.sub.call(sub.ctx.m, sub.ctx.m))));
}
function combineSagas(sagas) {
    if (!sagas.length) {
        return noeff;
    }
    const tasks = map(sagas, ({ saga, ctx, action }) => {
        if (action) {
            saga = createActionWatcherSaga(saga, action);
        }
        else if (process.env.NODE_ENV !== "production") {
            let fn = saga;
            saga = function* (model) {
                yield fork([model, fn], model);
            };
            Object.defineProperty(saga, "name", {
                configurable: true,
                enumerable: false,
                writable: false,
                value: `saga/daemon:${saga.name || uniqueId("saga")}`
            });
        }
        return { saga, ctx };
    });
    return function* rootSaga() {
        yield all(map(tasks, task => task.saga.call(task.ctx.m, task.ctx.m)));
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
        runSaga(assign({}, store.io, options.saga), combineSagas(store.sagas));
        unsub = combineSubs(store.subs)();
    };
    runSaga(assign({}, store.io, options.saga), combineSagas(store.sagas));
    unsub = combineSubs(store.subs)();
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
    model.sagas = nextModel.sagas;
    model.subs = nextModel.subs;
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
    const sagas = map(options.sagas, (fn) => {
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
        return wrapper;
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
    }), mapValues(modules, module => module.actions));
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
                // Attach action actions.
                forOwn(actionsActionKeyMap, (key, name) => {
                    dispatch[name] = createActionDispatcher(store, key);
                });
                // Attach module actions.
                forOwn(modelModules, (model, name) => {
                    dispatch[name] = model.dispatch;
                });
                // Create model sub list, modules' first.
                const modelSubs = modelModules
                    ? concat([], ...map(modelModules, model => model.subs))
                    : [];
                forEach(subs, sub => {
                    modelSubs.push({
                        sub,
                        ctx: context
                    });
                });
                // Create model sagas.
                const modelSagas = modelModules
                    ? concat([], ...map(modelModules, model => model.sagas))
                    : [];
                forOwn(effects, (effect, name) => {
                    if (isGeneratorFunction(effect)) {
                        modelSagas.push({
                            saga: effect,
                            ctx: context,
                            action: effectActionKeyMap[name]
                        });
                    }
                });
                forEach(sagas, saga => {
                    modelSagas.push({
                        saga,
                        ctx: context
                    });
                });
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
                    // model sagas.
                    sagas: modelSagas,
                    // model subs.
                    subs: modelSubs
                });
            }
        };
    });
    // Config object
    const config = {
        actions: actionCreators,
        configure: configure,
        subscribe(sub) {
            subscribe(sub);
            return config;
        }
    };
    return config;
});
export { bootstrap, init, hotReload, model };
