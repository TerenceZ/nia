"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var wrap_1 = require("./wrap");
/**
 * Use a module.
 */
function module(mod) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return wrap_1.unwrap(Reflect.apply(mod, null, args));
}
exports.module = module;
