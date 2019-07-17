"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = __importDefault(require("vue"));
var context = null;
function getContext() {
    return context;
}
exports.getContext = getContext;
function setContext(ctx) {
    context = ctx;
    return context;
}
exports.setContext = setContext;
function createDefaultContext() {
    return {
        mutations: {},
        actions: {},
        services: [],
        subs: [],
        vm: new vue_1.default(),
        strict: false,
        // runtime is setup from init().
        runtime: {
            store: null,
            chan: null,
        },
    };
}
exports.createDefaultContext = createDefaultContext;
