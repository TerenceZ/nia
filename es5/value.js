"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var vue_1 = __importDefault(require("vue"));
var context_1 = require("./context");
var assert_1 = __importDefault(require("assert"));
var lodash_1 = require("lodash");
exports.VALUE_TAG = Symbol(process.env.NODE_ENV !== "production" ? "Value" : "");
exports.VALUE_GETTER_TAG = Symbol(process.env.NODE_ENV !== "production" ? "ValueGetter" : "");
function value(initial) {
    if (initial && initial[exports.VALUE_TAG]) {
        return initial;
    }
    var value = utils_1.defineTagProperty(vue_1.default.observable({
        value: initial
    }), exports.VALUE_TAG);
    if (process.env.NODE_ENV !== "production") {
        var descriptor = Reflect.getOwnPropertyDescriptor(value, "value");
        descriptor.get = utils_1.defineTagProperty(descriptor.get, exports.VALUE_GETTER_TAG);
        Reflect.defineProperty(value, "value", descriptor);
        var context = context_1.getContext();
        if (context.strict) {
            var runtime_1 = context.runtime;
            context.vm.$watch(function () { return value.value; }, function () {
                assert_1.default(runtime_1.store._committing, "do not mutate vuex store state outside mutation handlers.");
            }, { deep: true, sync: true });
        }
    }
    return value;
}
exports.value = value;
function isValue(value) {
    return value && value[exports.VALUE_TAG];
}
exports.isValue = isValue;
function isValueGetter(value) {
    return value && value[exports.VALUE_GETTER_TAG];
}
exports.isValueGetter = isValueGetter;
function unwrap(value, plain) {
    if (plain === void 0) { plain = false; }
    if (!value) {
        return value;
    }
    if (isValue(value)) {
        return value.value;
    }
    if (lodash_1.isPlainObject(value)) {
        if (plain) {
            return lodash_1.mapValues(value, unwrap);
        }
        var result = {};
        for (var prop in value) {
            if (Reflect.has(value, prop)) {
                unwrapProp(prop, value, result);
            }
        }
        return result;
    }
    if (lodash_1.isArrayLike(value)) {
        var result = [];
        for (var i = 0, n = value.length; i < n; ++i) {
            unwrapProp(value[i], value, result);
        }
        return result;
    }
    return value;
}
exports.unwrap = unwrap;
function unwrapProp(key, source, target) {
    var descriptor = Reflect.getOwnPropertyDescriptor(source, key);
    if (!descriptor.get) {
        if (descriptor.value) {
            if (isValue(descriptor.value)) {
                Reflect.defineProperty(target, key, Reflect.getOwnPropertyDescriptor(descriptor.value, "value"));
                return;
            }
            if (descriptor.value.__ob__) {
                Reflect.defineProperty(target, key, descriptor);
                return;
            }
        }
        descriptor.value = unwrap(descriptor.value);
    }
    Reflect.defineProperty(target, key, descriptor);
}
