"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var subscribe_1 = require("./subscribe");
var context_1 = require("./context");
/**
 * Subscribe on each dispatched action.
 */
function onDispatch(fn) {
    var runtime = context_1.getContext().runtime;
    return subscribe_1.subscribe(function () { return runtime.store.subscribeAction(fn); });
}
exports.onDispatch = onDispatch;
