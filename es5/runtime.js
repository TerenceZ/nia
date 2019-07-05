"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var vuex_1 = require("vuex");
var lodash_1 = require("lodash");
var redux_saga_1 = require("redux-saga");
var effects_1 = require("redux-saga/effects");
var assert_1 = __importDefault(require("assert"));
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
    return lodash_1.reduce(keyMap, function (actions, key, name) {
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
    return lodash_1.mapKeys(lodash_1.mapValues(mutationKeyMap, function (mutationKey, name) {
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
    return lodash_1.mapKeys(lodash_1.mapValues(keyMap, function (key, name) { return createActionEffect(name, key, context); }), function (fn_, name) { return keyMap[name]; });
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
function createActionWatcherSaga(saga, type) {
    var wrapped = function (ctx) {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!true) return [3 /*break*/, 3];
                    _a = effects_1.fork;
                    _b = [[ctx.m, saga], ctx.m];
                    return [4 /*yield*/, effects_1.take(type)];
                case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_c.sent()).payload]))];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 0];
                case 3: return [2 /*return*/];
            }
        });
    };
    if (process.env.NODE_ENV !== "production") {
        Object.defineProperty(wrapped, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: "saga/fork:" + type
        });
    }
    return wrapped;
}
function noeff() {
    return __generator(this, function (_a) {
        return [2 /*return*/];
    });
}
function combineSubs(subs) {
    if (!subs.length) {
        return lodash_1.noop;
    }
    return function () { return lodash_1.flowRight(lodash_1.compact(lodash_1.map(subs, function (_a) {
        var sub = _a.sub, ctx = _a.ctx;
        return sub.call(ctx);
    }))); };
}
function combineSagas(sagas) {
    if (!sagas.length) {
        return noeff;
    }
    var tasks = lodash_1.map(sagas, function (_a) {
        var saga = _a.saga, ctx = _a.ctx, action = _a.action;
        if (action) {
            saga = createActionWatcherSaga(saga, action);
        }
        else if (process.env.NODE_ENV !== "production") {
            var fn_1 = saga;
            saga = function (sagaCtx) {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, effects_1.fork([sagaCtx.m, fn_1], sagaCtx.m)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            };
            Object.defineProperty(saga, "name", {
                configurable: true,
                enumerable: false,
                writable: false,
                value: "saga/daemon:" + (saga.name || lodash_1.uniqueId("saga"))
            });
        }
        return { saga: saga, ctx: ctx };
    });
    return function rootSaga() {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, effects_1.all(lodash_1.map(tasks, function (task) { return task.saga.call(task.ctx.m, task.ctx.m); }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    };
}
// API declaration
var bootstrap;
exports.bootstrap = bootstrap;
var init;
exports.init = init;
var hotReload;
exports.hotReload = hotReload;
var model;
exports.model = model;
// API: bootstrap()
exports.bootstrap = bootstrap = function (factory, options) {
    if (options === void 0) { options = {}; }
    var store = init(factory, lodash_1.pick(options, ["plugins", "strict", "services"]));
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
        store.io.channel.put(redux_saga_1.END);
    };
    store.hotReload = function (nextFactory) {
        store.stop();
        stopped = false;
        hotReload(store, nextFactory);
        redux_saga_1.runSaga(lodash_1.assign({}, store.io, options.saga), combineSagas(store.sagas));
        unsub = combineSubs(store.subs)();
    };
    redux_saga_1.runSaga(lodash_1.assign({}, store.io, options.saga), combineSagas(store.sagas));
    unsub = combineSubs(store.subs)();
    return store;
};
// API: init()
exports.init = init = function (factory, options) {
    if (options === void 0) { options = {}; }
    var _a = factory.configure(), storeOptions = _a.store, bind = _a.bind;
    var store = new vuex_1.Store(lodash_1.assign({
        plugins: options.plugins,
        strict: options.strict
    }, storeOptions));
    var channel = redux_saga_1.stdChannel();
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
exports.hotReload = hotReload = function (model, factory, options) {
    if (options === void 0) { options = {}; }
    var _a = factory.configure(), storeOptions = _a.store, bind = _a.bind;
    var channel = redux_saga_1.stdChannel();
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
    model.sagas = nextModel.sagas;
    model.subs = nextModel.subs;
    model.dispatch = nextModel.dispatch;
    model.io = createIO(model.store, channel);
};
// API: model()
exports.model = model = (function (options) {
    var prefix = "";
    if (process.env.NODE_ENV != "production") {
        prefix = options.__prefix;
    }
    var modules = options.modules;
    // name creator.
    var nameCreator = function (category) { return function (_, key) {
        return process.env.NODE_ENV !== "production"
            ? "" + (category || "") + prefix + "/" + key
            : lodash_1.uniqueId();
    }; };
    // Generate getter keys.
    var getters = options.getters;
    var getterKeyMap = lodash_1.mapValues(getters, nameCreator());
    // Generate action action keys.
    var actionsActionKeyMap = lodash_1.mapValues((options.actions || {}), nameCreator(process.env.NODE_ENV !== "production" ? "action/action:" : ""));
    // Generate mutation action keys.
    var mutations = options.mutations;
    var mutationActionKeyMap = lodash_1.mapValues(mutations, nameCreator(process.env.NODE_ENV !== "production" ? "mutation:" : ""));
    // Generate mutation effects.
    var mutationEffectActionKeyMap = lodash_1.mapValues(mutations, nameCreator(process.env.NODE_ENV !== "production" ? "action/mutation:" : ""));
    // Generate effect action keys from effects and mutatons.
    var effects = options.effects;
    var effectActionKeyMap = lodash_1.mapValues(effects, nameCreator(process.env.NODE_ENV !== "production" ? "action/effect:" : ""));
    // Resolve sagas.
    var sagas = [];
    lodash_1.forOwn(options.sagas, function (fn) {
        var wrapper = fn;
        if (process.env.NODE_ENV !== "production") {
            wrapper = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return fn.apply(this, args);
            };
            Object.defineProperty(wrapper, "name", {
                configurable: true,
                writable: false,
                enumerable: false,
                value: nameCreator()(null, fn.name || lodash_1.uniqueId("service"))
            });
        }
        sagas.push(wrapper);
    });
    // Check if actions conflict.
    if (process.env.NODE_ENV !== "production") {
        var conflicts = lodash_1.intersection(lodash_1.keys(actionsActionKeyMap), lodash_1.keys(mutationEffectActionKeyMap), lodash_1.keys(effectActionKeyMap), lodash_1.keys(modules));
        assert_1.default(!conflicts.length, "[PANIC] name conflicts for effects, mutations and service actions under namespace \"" + prefix + "\":\n  " + conflicts);
    }
    // Create action creators.
    var actionCreators = lodash_1.merge(lodash_1.mapValues(lodash_1.merge({}, actionsActionKeyMap, mutationEffectActionKeyMap, effectActionKeyMap), function (type) {
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
    }), lodash_1.mapValues(modules, function (module) { return module.actions; }));
    // Sucribe.
    var subs = [];
    var subscribe = function (sub) {
        subs.push(sub);
    };
    // Configure
    var configure = (function () {
        var context = {};
        // Generate store getters.
        var storeGetters = lodash_1.mapKeys(lodash_1.mapValues(getterKeyMap, function (key, name) {
            return wrapGetter(getters[name], context, key);
        }), function (getter_, name) { return getterKeyMap[name]; });
        // Generate store mutations.
        var storeMutations = lodash_1.mapKeys(lodash_1.mapValues(mutationActionKeyMap, function (key, name) {
            return wrapMutation(mutations[name], context, key);
        }), function (mutation_, name) { return mutationActionKeyMap[name]; });
        // Generate store actions from effects.
        var storeActions = createEffectsStoreActions(effects, effectActionKeyMap, context);
        // Generate store actions from mutation effects.
        lodash_1.merge(storeActions, createMutationsStoreActions(mutationEffectActionKeyMap, mutationActionKeyMap, context), createActionsStoreActions(actionsActionKeyMap, context));
        // Generate store modules.
        var moduleConfigs = lodash_1.mapValues(modules, function (module) { return module.configure(); });
        var storeModules = lodash_1.mapValues(moduleConfigs, function (_a) {
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
                var modelModules = lodash_1.mapValues(moduleConfigs, function (_a, key) {
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
                var modelGetters = lodash_1.reduce(getterKeyMap, function (getters, key, name) {
                    var descriptor = Object.getOwnPropertyDescriptor(store.getters, key);
                    if (process.env.NODE_ENV !== "production") {
                        assert_1.default(descriptor, "[PANIC] Failed to get property \"" + key + "\" from store.");
                    }
                    Object.defineProperty(getters, name, descriptor);
                    return getters;
                }, lodash_1.mapValues(modelModules, function (model) { return model.getters; }));
                // Create model dispatcher.
                var dispatch = createModelDispatcher(prefix, store);
                // Attach mutation effect actions.
                lodash_1.forOwn(mutationEffectActionKeyMap, function (key, name) {
                    dispatch[name] = createActionDispatcher(store, key);
                });
                // Attach effect actions.
                lodash_1.forOwn(effectActionKeyMap, function (key, name) {
                    dispatch[name] = createActionDispatcher(store, key);
                });
                // Attach module actions.
                lodash_1.forOwn(modelModules, function (model, name) {
                    dispatch[name] = model.dispatch;
                });
                // Create model sub list, modules' first.
                var modelSubs = modelModules
                    ? lodash_1.concat.apply(void 0, [[]].concat(lodash_1.map(modelModules, function (model) { return model.subs; }))) : [];
                lodash_1.forEach(subs, function (sub) {
                    modelSubs.push({
                        sub: sub,
                        ctx: context
                    });
                });
                // Create model sagas.
                var modelSagas = modelModules
                    ? lodash_1.concat.apply(void 0, [[]].concat(lodash_1.map(modelModules, function (model) { return model.sagas; }))) : [];
                lodash_1.forOwn(effects, function (effect, name) {
                    if (isGeneratorFunction(effect)) {
                        modelSagas.push({
                            saga: effect,
                            ctx: context,
                            action: effectActionKeyMap[name]
                        });
                    }
                });
                lodash_1.forEach(sagas, function (saga) {
                    modelSagas.push({
                        saga: saga,
                        ctx: context
                    });
                });
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
                    data: lodash_1.isFunction(data) ? data() : data || {},
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
    var config = {
        actions: actionCreators,
        configure: configure,
        subscribe: function (sub) {
            subscribe(sub);
            return config;
        }
    };
    return config;
});
