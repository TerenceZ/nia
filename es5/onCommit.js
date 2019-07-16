"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("./context");
var subscribe_1 = require("./subscribe");
/**
 * Subscribe on each committed mutation.
 */
function onCommit(fn) {
    var runtime = context_1.getContext().runtime;
    return subscribe_1.subscribe(function () { return runtime.store.subscribe(fn); });
}
exports.onCommit = onCommit;
