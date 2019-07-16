"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = __importDefault(require("vue"));
/// Dirty Hack Code to Get Vue Internal Constructorrs
var Watcher;
exports.Watcher = Watcher;
var Dep;
exports.Dep = Dep;
new vue_1.default({
    data: { v: 0 },
    computed: {
        f: function () {
            return this.v;
        }
    },
    render: function (c) {
        return c("a");
    },
    mounted: function () {
        // Trigger lazy watcher to collect deps.
        var _ = this.f; // eslint-disable-line @typescript-eslint/no-unused-vars
        var watcher = this._watchers[0];
        exports.Watcher = Watcher = watcher.constructor;
        exports.Dep = Dep = watcher.deps[0].constructor;
    }
}).$mount();
function defineTagProperty(target, name) {
    Reflect.defineProperty(target, name, {
        value: true
    });
    return target;
}
exports.defineTagProperty = defineTagProperty;
exports.noop = function () { };
exports.identity = function (value) {
    return value;
};
