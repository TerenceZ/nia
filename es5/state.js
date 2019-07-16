"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("./context");
var vue_1 = __importDefault(require("vue"));
var assert_1 = __importDefault(require("assert"));
/**
 * Define a reactive state object.
 */
function state(target) {
    var state = vue_1.default.observable(target);
    if (process.env.NODE_ENV !== "production" && context_1.getContext().strict) {
        var context = context_1.getContext();
        var runtime_1 = context.runtime;
        context.vm.$watch(function () { return state; }, function () {
            assert_1.default(runtime_1.store._committing, "do not mutate vuex store state outside mutation handlers.");
        }, { deep: true, sync: true });
    }
    return state;
}
exports.state = state;
