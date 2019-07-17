"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var computed_1 = require("./computed");
var utils_1 = require("./utils");
function getter(fn) {
    return computed_1.computed(fn, utils_1.noop);
}
exports.getter = getter;
