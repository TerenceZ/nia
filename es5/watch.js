"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var value_1 = require("./value");
var context_1 = require("./context");
var lodash_1 = require("lodash");
var assert_1 = __importDefault(require("assert"));
var utils_1 = require("./utils");
var subscribe_1 = require("./subscribe");
function watch(target, cb, opts) {
    if (opts === void 0) { opts = {}; }
    var getter;
    if (lodash_1.isArray(target)) {
        getter = createArrayWatchGetter(target);
    }
    else if (value_1.isValue(target)) {
        getter = createValueWatchGetter(target);
    }
    else {
        getter = target;
    }
    var context = context_1.getContext();
    var _a = createWatchUpdaterAndCleaner(cb), update = _a[0], clean = _a[1];
    var vm = context.vm;
    return subscribe_1.subscribe(function () {
        var watcher = new utils_1.Watcher(vm, getter, update, {
            deep: opts.deep,
            sync: opts.flush === 'sync',
        });
        if (!opts.lazy) {
            update(watcher.value, undefined);
        }
        return function () {
            clean();
            watcher.teardown();
        };
    });
}
exports.watch = watch;
function createValueWatchGetter(wrapper) {
    return function () { return wrapper.value; };
}
function createArrayWatchGetter(list) {
    var values;
    var getters = list.map(function (value) {
        return lodash_1.isFunction(value)
            ? value
            : createValueWatchGetter(value);
    });
    return function () {
        var changed = values != null;
        var nextValues = [];
        for (var i = 0; i < getters.length; ++i) {
            nextValues[i] = getters[i]();
            changed = changed || !lodash_1.eq(nextValues[i], values[i]);
        }
        if (changed) {
            values = nextValues;
        }
        return values;
    };
}
function createWatchUpdaterAndCleaner(update) {
    var clean = utils_1.noop;
    var cleaner = function () {
        var c = clean;
        clean = utils_1.noop;
        if (c) {
            c();
        }
    };
    var onCleanup = function (cb) {
        if (process.env.NODE_ENV !== 'production') {
            assert_1.default(clean === utils_1.noop, "[PANIC] Only one cleanup function can be set on one update call.");
        }
        clean = cb;
    };
    var updater = function (value, prevValue) {
        cleaner();
        update(value, prevValue, onCleanup);
    };
    return [updater, cleaner];
}
