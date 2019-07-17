"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var vue_1 = __importDefault(require("vue"));
var context_1 = require("./context");
var assert_1 = __importDefault(require("assert"));
/**
 * @private
 */
exports.VALUE_TAG = Symbol(process.env.NODE_ENV !== 'production' ? 'Value' : '');
/**
 * @private
 */
exports.VALUE_GETTER_TAG = Symbol(process.env.NODE_ENV !== 'production' ? 'ValueGetter' : '');
function value(initial) {
    if (initial && initial[exports.VALUE_TAG]) {
        return initial;
    }
    var value = utils_1.defineTagProperty(vue_1.default.observable({
        value: initial,
    }), exports.VALUE_TAG);
    if (process.env.NODE_ENV !== 'production') {
        var descriptor = Reflect.getOwnPropertyDescriptor(value, 'value');
        utils_1.defineTagProperty(descriptor.get, exports.VALUE_GETTER_TAG);
        Reflect.defineProperty(value, 'value', descriptor);
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
/**
 * @private
 */
function isValueGetter(value) {
    return value && value[exports.VALUE_GETTER_TAG];
}
exports.isValueGetter = isValueGetter;
