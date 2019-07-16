"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var value_1 = require("./value");
var utils_1 = require("./utils");
var context_1 = require("./context");
var lodash_1 = require("lodash");
var COMPUTED_TAG = Symbol(process.env.NODE_ENV !== "production" ? "Computed" : "");
var COMPUTED_GETTER_TAG = Symbol(process.env.NODE_ENV !== "production" ? "ComputedGetter" : "");
var computedWatcherOptions = { lazy: true };
var computedPropertyOptions = {
    configurable: true,
    enumerable: true
};
/**
 * Define a computed value wrapper.
 */
function computed(get, set) {
    var context = context_1.getContext();
    var watcher = new utils_1.Watcher(context.vm, get, utils_1.noop, computedWatcherOptions);
    var computed = {};
    computedPropertyOptions.set = set;
    computedPropertyOptions.get = function () {
        if (watcher.dirty) {
            watcher.evaluate();
        }
        if (utils_1.Dep.target) {
            watcher.depend();
        }
        return watcher.value;
    };
    if (process.env.NODE_ENV !== "production") {
        utils_1.defineTagProperty(computedPropertyOptions.get, value_1.VALUE_GETTER_TAG);
        utils_1.defineTagProperty(computedPropertyOptions.get, COMPUTED_GETTER_TAG);
    }
    Reflect.defineProperty(computed, "value", computedPropertyOptions);
    utils_1.defineTagProperty(computed, value_1.VALUE_TAG);
    utils_1.defineTagProperty(computed, COMPUTED_TAG);
    return computed;
}
exports.computed = computed;
/**
 * Define computed from map.
 */
function computedMap(map) {
    return lodash_1.mapValues(map, function (value) {
        return lodash_1.isFunction(value) ? computed(value) : computed(value.get, value.set);
    });
}
exports.computedMap = computedMap;
function isComputed(value) {
    return value && value[COMPUTED_TAG];
}
exports.isComputed = isComputed;
function isComputedGetter(value) {
    return value && value[COMPUTED_GETTER_TAG];
}
exports.isComputedGetter = isComputedGetter;
