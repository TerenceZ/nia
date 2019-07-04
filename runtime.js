var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
        channel: channel,
        dispatch: createModelDispatcher(process.env.NODE_ENV !== "production" ? "root" : "", store)
    };
}
function createModelDispatcher(namespace, store) {
    var fn = function (action) { return store.dispatch(action); };
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(fn, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: "model/dispach:" + namespace
        });
    }
    return fn;
}
function createActionDispatcher(store, type) {
    var fn = function (payload) { return store.dispatch({ type: type, payload: payload }); };
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(fn, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: "action/dispatch:" + type
        });
    }
    return fn;
}
function createEffectsStoreActions(effects, keyMap, context) {
    var dispatcher = function (store_, action) {
        context.c.put(action);
    };
    return reduce(keyMap, function (actions, key, name) {
        var fn;
        if (isGeneratorFunction(effects[name])) {
            fn =
                process.env.NODE_ENV !== "production"
                    ? createSagaDispatcher(context, "effect/dispatch:" + key)
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
    var dispatcher = function (store_, action) {
        context.c.put(action);
    };
    return reduce(keyMap, function (actions, key) {
        actions[key] =
            process.env.NODE_ENV !== "production"
                ? createSagaDispatcher(context, "service/dispatch:" + key)
                : dispatcher;
        return actions;
    }, {});
}
function createMutationEffect(name, type, context) {
    var fn = function (store, action) {
        store.commit(type, action.payload);
        context.c.put(action);
    };
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(fn, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: "mutation/effect:" + name
        });
    }
    return fn;
}
function createMutationsStoreActions(effectKeyMap, mutationKeyMap, context) {
    return mapKeys(mapValues(mutationKeyMap, function (mutationKey, name) {
        return createMutationEffect(name, mutationKey, context);
    }), function (fn_, name) { return effectKeyMap[name]; });
}
function createActionEffect(name, type, context) {
    var fn = function (store, action) {
        context.c.put(action);
    };
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(fn, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: "action/effect:" + name
        });
    }
    return fn;
}
function createActionsStoreActions(keyMap, context) {
    return mapKeys(mapValues(keyMap, function (key, name) { return createActionEffect(name, key, context); }), function (fn_, name) { return keyMap[name]; });
}
function wrapGetter(fn, context, name) {
    var wrapped = function () { return fn.call(context.m, context.m); };
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(wrapped, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: "getter:" + name
        });
    }
    return wrapped;
}
function wrapMutation(fn, context, name) {
    var wrapped = function (state_, payload) {
        return fn.call(context.m, context.m, payload);
    };
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(wrapped, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: "mutation:" + name
        });
    }
    return wrapped;
}
function wrapEffect(fn, context, name) {
    var wrapped = function (store_, action) {
        var res = fn.call(context.m, context.m, action.payload);
        context.c.put(action);
        return res;
    };
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(wrapped, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: "effect:" + name
        });
    }
    return wrapped;
}
function createSagaDispatcher(context, name) {
    var dispatcher = function (vctx_, action) {
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
    return concat(map(effects, function (effect, name) { return [keyMap[name], effect]; }), map(services, function (service) { return [null, service]; }));
}
function wrapForkSaga(saga, context, key) {
    var wrapped = function (action) {
        return fork([context.m, saga], context.m, action.payload);
    };
    if (process.env.NODE_ENV !== "production" && (key || saga.name)) {
        Object.defineProperty(wrapped, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: "saga/fork:" + (key || saga.name)
        });
    }
    return wrapped;
}
function noeff() {
    return __generator(this, function (_a) {
        return [2 /*return*/];
    });
}
function combineSubscriptions(subs) {
    subs = filter(subs, function (sub) { return sub !== noop; });
    if (!subs.length) {
        return noop;
    }
    if (subs.length === 1) {
        return subs[0];
    }
    return function () {
        var unsubs = reverse(compact(map(subs, function (sub) { return sub(); })));
        return unsubs.length
            ? function () {
                forEach(unsubs, function (unsub) { return unsub(); });
            }
            : noop;
    };
}
function combineSagas(sagas, context) {
    sagas = filter(map(sagas, function (effect) {
        var fn;
        if (isArray(effect)) {
            var type_1 = effect[0], eff = effect[1];
            var fork_1 = wrapForkSaga(eff, context, type_1);
            fn =
                type_1 != null
                    ? function () {
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    if (!true) return [3 /*break*/, 3];
                                    _a = fork_1;
                                    return [4 /*yield*/, take(type_1)];
                                case 1: return [4 /*yield*/, _a.apply(void 0, [_b.sent()])];
                                case 2:
                                    _b.sent();
                                    return [3 /*break*/, 0];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }
                    : function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fork_1({})];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
            if (process.env.NODE_ENV !== "production") {
                Object.defineProperty(fn, "name", {
                    configurable: true,
                    enumerable: false,
                    writable: false,
                    value: "saga/daemon:" + (type_1 || eff.name || uniqueId("service"))
                });
            }
        }
        else {
            fn = effect;
        }
        return fn;
    }), function (saga) { return saga !== noeff; });
    if (!sagas.length) {
        return noeff;
    }
    if (sagas.length === 1) {
        return sagas[0];
    }
    return function saga() {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, all(map(sagas, function (saga) { return saga(); }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    };
}
// API declaration
var bootstrap;
var init;
var hotReload;
var model;
// API: bootstrap()
bootstrap = function (factory, options) {
    if (options === void 0) { options = {}; }
    var store = init(factory, pick(options, ["plugins", "strict", "providers"]));
    var unsub;
    var stopped = false;
    store.stop = function () {
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
    store.hotReload = function (nextFactory) {
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
init = function (factory, options) {
    if (options === void 0) { options = {}; }
    var _a = factory.configure(), storeOptions = _a.store, bind = _a.bind;
    var store = new Store(assign({
        plugins: options.plugins,
        strict: options.strict
    }, storeOptions));
    var channel = stdChannel();
    var model = bind({
        namespace: [],
        services: options.services,
        state: store.state,
        store: store,
        channel: channel
    });
    model.store = store;
    model.io = createIO(store, channel);
    return model;
};
// API: hotReload()
hotReload = function (model, factory, options) {
    if (options === void 0) { options = {}; }
    var _a = factory.configure(), storeOptions = _a.store, bind = _a.bind;
    var channel = stdChannel();
    model.store.hotUpdate(storeOptions);
    var nextModel = bind({
        namespace: [],
        services: options.services,
        state: model.store.state,
        store: model.store,
        channel: channel
    });
    model.actions = nextModel.actions;
    model.getters = nextModel.getters;
    model.saga = nextModel.saga;
    model.subscribe = nextModel.subscribe;
    model.dispatch = nextModel.dispatch;
    model.io = createIO(model.store, channel);
};
// API: model()
model = (function (options) {
    var prefix = "";
    if (process.env.NODE_ENV != "production") {
        prefix = options.__prefix;
    }
    var modules = options.modules;
    // name creator.
    var nameCreator = function (category) { return function (_, key) {
        return process.env.NODE_ENV !== "production"
            ? "" + (category || "") + prefix + "/" + key
            : uniqueId();
    }; };
    // Generate getter keys.
    var getters = options.getters;
    var getterKeyMap = mapValues(getters, nameCreator());
    // Generate action action keys.
    var actionsActionKeyMap = mapValues((options.actions || {}), nameCreator(process.env.NODE_ENV !== "production" ? "action/action:" : ""));
    // Generate mutation action keys.
    var mutations = options.mutations;
    var mutationActionKeyMap = mapValues(mutations, nameCreator(process.env.NODE_ENV !== "production" ? "mutation:" : ""));
    // Generate mutation effects.
    var mutationEffectActionKeyMap = mapValues(mutations, nameCreator(process.env.NODE_ENV !== "production" ? "action/mutation:" : ""));
    // Generate effect action keys from effects and mutatons.
    var effects = options.effects;
    var effectActionKeyMap = mapValues(effects, nameCreator(process.env.NODE_ENV !== "production" ? "action/effect:" : ""));
    // Resolve sagas.
    var sagas = [];
    forOwn(options.sagas, function (fn) {
        if (process.env.NODE_ENV !== "production") {
            Object.defineProperty(fn, "name", {
                configurable: true,
                writable: false,
                enumerable: false,
                value: nameCreator()(null, fn.name || uniqueId("service"))
            });
        }
        sagas.push(fn);
    });
    // Check if actions conflict.
    if (process.env.NODE_ENV !== "production") {
        var conflicts = intersection(keys(actionsActionKeyMap), keys(mutationEffectActionKeyMap), keys(effectActionKeyMap), keys(modules));
        assert(!conflicts.length, "[PANIC] name conflicts for effects, mutations and service actions under namespace \"" + prefix + "\":\n  " + conflicts);
    }
    // Create action creators.
    var actionCreators = merge(mapValues(merge({}, actionsActionKeyMap, mutationEffectActionKeyMap, effectActionKeyMap), function (type) {
        var fn = function (payload) { return ({
            type: type,
            payload: payload
        }); };
        Object.defineProperty(fn, "toString", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: function () { return type; }
        });
        if (process.env.NODE_ENV !== "production") {
            Object.defineProperty(fn, "name", {
                configurable: true,
                enumerable: false,
                writable: false,
                value: "action:" + type
            });
        }
        return fn;
    }), mapValues(modules, function (module) { return module.actions_; }));
    // Sucribe.
    var subs = [];
    var subscribe = function (sub) {
        subs.push(sub);
    };
    // Configure
    var configure = (function () {
        var context = {};
        // Generate store getters.
        var storeGetters = mapKeys(mapValues(getterKeyMap, function (key, name) {
            return wrapGetter(getters[name], context, key);
        }), function (getter_, name) { return getterKeyMap[name]; });
        // Generate store mutations.
        var storeMutations = mapKeys(mapValues(mutationActionKeyMap, function (key, name) {
            return wrapMutation(mutations[name], context, key);
        }), function (mutation_, name) { return mutationActionKeyMap[name]; });
        // Generate store actions from effects.
        var storeActions = createEffectsStoreActions(effects, effectActionKeyMap, context);
        // Generate store actions from mutation effects.
        merge(storeActions, createMutationsStoreActions(mutationEffectActionKeyMap, mutationActionKeyMap, context), createActionsStoreActions(actionsActionKeyMap, context));
        // Generate store modules.
        var moduleConfigs = mapValues(modules, function (module) { return module.configure(); });
        var storeModules = mapValues(moduleConfigs, function (_a) {
            var store = _a.store;
            return store;
        });
        var data = options.data;
        return {
            // The config for store.
            store: {
                state: options.state,
                getters: storeGetters,
                mutations: storeMutations,
                actions: storeActions,
                modules: storeModules
            },
            bind: function (_a) {
                var namespace = _a.namespace, store = _a.store, state = _a.state, channel = _a.channel, services = _a.services;
                context.c = channel;
                // Bind modules.
                var modelModules = mapValues(moduleConfigs, function (_a, key) {
                    var bind = _a.bind;
                    return bind({
                        namespace: namespace.concat([key]),
                        store: store,
                        state: state[key],
                        channel: channel,
                        services: services
                    });
                });
                // Create model getters.
                var modelGetters = reduce(getterKeyMap, function (getters, key, name) {
                    var descriptor = Object.getOwnPropertyDescriptor(store.getters, key);
                    if (process.env.NODE_ENV !== "production") {
                        assert(descriptor, "[PANIC] Failed to get property \"" + key + "\" from store.");
                    }
                    Object.defineProperty(getters, name, descriptor);
                    return getters;
                }, mapValues(modelModules, function (model) { return model.getters; }));
                // Create model dispatcher.
                var dispatch = createModelDispatcher(prefix, store);
                // Attach mutation effect actions.
                forOwn(mutationEffectActionKeyMap, function (key, name) {
                    dispatch[name] = createActionDispatcher(store, key);
                });
                // Attach effect actions.
                forOwn(effectActionKeyMap, function (key, name) {
                    dispatch[name] = createActionDispatcher(store, key);
                });
                // Attach module actions.
                forOwn(modelModules, function (model, name) {
                    dispatch[name] = model.dispatch;
                });
                // Create model sub list, modules' first.
                var modelSubscription = combineSubscriptions(concat(map(modelModules, function (model) { return model.subscribe; }), map(subs, function (sub) { return function () { return sub(context.m); }; })));
                // Create model service.
                var modelService = combineSagas(concat(map(modelModules, function (model) { return model.saga; }), createModelSagas(sagas, effects, effectActionKeyMap)), context);
                return (context.m = {
                    namespace: namespace,
                    services: services,
                    // for sub context.
                    onStoreCommit: function (fn) {
                        return store.subscribe(fn);
                    },
                    onStoreDispatch: function (fn) {
                        return store.subscribeAction(fn);
                    },
                    watch: function (getter, cb, options) {
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
    var config = {
        actions_: actionCreators,
        configure: configure,
        subscribe: function (sub) {
            subscribe(sub);
            return config;
        }
    };
    return config;
});
export { bootstrap, init, hotReload, model };
