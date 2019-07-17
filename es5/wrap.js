"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var value_1 = require("./value");
var assert_1 = __importDefault(require("assert"));
var lodash_1 = require("lodash");
var utils_1 = require("./utils");
function wrap(value) {
    if (process.env.NODE_ENV !== 'production') {
        assert_1.default(value, "[PANIC] Falsy value cannot be wrapped.");
        assert_1.default(!value_1.isValue(value), "[PANIC] Value wrapper cannot be wrapped.");
        assert_1.default(lodash_1.isPlainObject(value), "[PANIC] Only plain object can be wrapped.");
    }
    var result = {};
    for (var prop in value) {
        if (Reflect.has(value, prop)) {
            var descriptor = Reflect.getOwnPropertyDescriptor(value, prop);
            if (value_1.isValue(descriptor.value)) {
                Reflect.defineProperty(result, prop, descriptor);
            }
            else {
                var wrapped = utils_1.defineTagProperty({}, value_1.VALUE_TAG);
                Reflect.defineProperty(wrapped, 'value', descriptor);
                result[prop] = wrapped;
            }
        }
    }
    Object.seal(result);
    return result;
}
exports.wrap = wrap;
function unwrap(value) {
    if (process.env.NODE_ENV !== 'production') {
        assert_1.default(value, "[PANIC] Falsy value cannot be unwrapped.");
        assert_1.default(!value_1.isValue(value), "[PANIC] Value wrapper cannot be unwrapped.");
        assert_1.default(lodash_1.isPlainObject(value), "[PANIC] Only plain object can be unwrapped.");
    }
    var result = {};
    for (var prop in value) {
        if (Reflect.has(value, prop)) {
            var descriptor = Reflect.getOwnPropertyDescriptor(value, prop);
            if (value_1.isValue(descriptor.value)) {
                descriptor = Reflect.getOwnPropertyDescriptor(descriptor.value, 'value');
            }
            Reflect.defineProperty(result, prop, descriptor);
        }
    }
    Object.seal(result);
    return result;
}
exports.unwrap = unwrap;
