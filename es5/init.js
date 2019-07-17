"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var context_1 = require("./context");
var vuex_1 = require("vuex");
var redux_saga_1 = require("redux-saga");
var value_1 = require("./value");
var assert_1 = __importDefault(require("assert"));
var lodash_1 = require("lodash");
var computed_1 = require("./computed");
var effects_1 = require("redux-saga/effects");
var utils_1 = require("./utils");
var wrap_1 = require("./wrap");
/**
 * Init a module.
 */
function init(mod, options) {
    if (options === void 0) { options = {}; }
    if (process.env.NODE_ENV !== 'production') {
        assert_1.default(!context_1.getContext(), "[PANIC] Failed to invoke init() cannot because another init() is being called.");
    }
    try {
        var context = context_1.setContext((options.context && options.context()) || context_1.createDefaultContext());
        context.strict = !!options.strict;
        // Initialize module.
        var instance = mod();
        // Create a vuex store to act as an event emitter,
        // and expose things on devtool.
        var vstore = new vuex_1.Store(__assign({}, extractStoreOptionsFromModule(instance), { actions: context.actions, mutations: context.mutations, plugins: options.plugins }));
        // Init runtime.
        var chan = redux_saga_1.stdChannel();
        var runtime = context.runtime;
        runtime.chan = chan;
        runtime.store = vstore;
        // Run context actions.
        var stopActions_1 = runContextActions(context, options);
        // Inject extra props.
        var vm_1 = context.vm;
        var store_1 = wrap_1.unwrap(instance);
        store_1.$store = vstore;
        store_1.$stop = function () {
            store_1.$stop = utils_1.noop;
            stopActions_1();
            vm_1.$destroy();
        };
        store_1.$reload = createHotReload(store_1, options);
        return store_1;
    }
    finally {
        context_1.setContext(null);
    }
}
exports.init = init;
function extractStoreOptionsFromModule(mod) {
    var state = {};
    var getters = {};
    if (process.env.NODE_ENV !== 'production') {
        var walk_1 = function (obj, path) {
            for (var prop in obj) {
                if (Reflect.has(obj, prop)) {
                    var descriptor = Reflect.getOwnPropertyDescriptor(obj, prop);
                    var key = path.length ? path.join('/') + "/" + prop : prop;
                    if (!descriptor.get) {
                        var value = descriptor.value;
                        if (value) {
                            if (value_1.isValue(value)) {
                                descriptor = Reflect.getOwnPropertyDescriptor(value, 'value');
                            }
                            else {
                                if (value.__ob__) {
                                    Reflect.defineProperty(state, key, descriptor);
                                    continue;
                                }
                                if (lodash_1.isPlainObject(value)) {
                                    walk_1(value, path.concat([prop]));
                                    continue;
                                }
                            }
                        }
                    }
                    if (computed_1.isComputedGetter(descriptor.get)) {
                        getters[key] = descriptor.get;
                    }
                    else if (value_1.isValueGetter(descriptor.get)) {
                        Reflect.defineProperty(state, key, descriptor);
                    }
                }
            }
        };
        walk_1(mod, []);
    }
    return { state: state, getters: getters };
}
function runContextActions(context, options) {
    var runtime = context.runtime;
    // Start sagas.
    var task = redux_saga_1.runSaga(lodash_1.assign({
        channel: runtime.chan,
        dispatch: lodash_1.bind(runtime.store.dispatch, runtime.store),
    }, options.saga), createRootSaga(context.services));
    // Invoke subscriptions.
    var unsub = lodash_1.flowRight(context.subs.map(function (sub) { return sub() || utils_1.noop; }));
    return function () {
        unsub();
        task.cancel();
    };
}
function createRootSaga(sagas) {
    return function rootSaga() {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, effects_1.all(lodash_1.map(sagas, function (saga) { return saga(); }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    };
}
function createHotReload(store, options) {
    return function (mod) {
        if (process.env.NODE_ENV === 'production') {
            return store;
        }
        try {
            store.$stop();
            var context = context_1.setContext((options.context && options.context()) || context_1.createDefaultContext());
            // Initialize module.
            var instance = mod();
            // Hot update store.
            store.$store.hotUpdate(__assign({}, extractStoreOptionsFromModule(instance), { actions: context.actions, mutations: context.mutations }));
            // Init runtime.
            var chan = redux_saga_1.stdChannel();
            var runtime = context.runtime;
            runtime.chan = chan;
            runtime.store = store.$store;
            // Run context actions.
            var stopActions_2 = runContextActions(context, options);
            // Inject extra props.
            var vm_2 = context.vm;
            var nextStore = wrap_1.unwrap(instance);
            // Copy new module props into store.
            for (var prop in nextStore) {
                if (Reflect.has(nextStore, prop)) {
                    Reflect.defineProperty(store, prop, Reflect.getOwnPropertyDescriptor(nextStore, prop));
                }
            }
            // Bind new stop.
            store.$stop = function () {
                store.$stop = utils_1.noop;
                stopActions_2();
                vm_2.$destroy();
            };
            return store;
        }
        finally {
            context_1.setContext(null);
        }
    };
}
