"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var value_1 = require("./value");
/**
 * Use a module.
 */
function module(mod) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return value_1.unwrap(Reflect.apply(mod, null, args));
}
exports.module = module;
