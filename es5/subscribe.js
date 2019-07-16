"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("./context");
var utils_1 = require("./utils");
/**
 * Add function to run after init.
 */
function subscribe(fn) {
    var stopped = false;
    var unsub = utils_1.noop;
    context_1.getContext().subs.push(function () {
        if (stopped) {
            return;
        }
        unsub = fn() || utils_1.noop;
    });
    return function () {
        stopped = true;
        var unsub_ = unsub;
        unsub = utils_1.noop;
        unsub_();
    };
}
exports.subscribe = subscribe;
