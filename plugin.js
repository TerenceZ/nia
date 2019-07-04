"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vuex_1 = require("vuex");
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
