"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var vuex_1 = __importDefault(require("vuex"));
function install(Vue) {
    var initStorePlugin = function () {
        var options = this.$options;
        // store injection
        if (options.$) {
            this.$ = options.$;
        }
        else if (options.parent && options.parent.$) {
            this.$ = options.parent.$;
        }
    };
    Vue.mixin({ beforeCreate: initStorePlugin });
    Vue.use(vuex_1.default);
}
exports.default = install;
