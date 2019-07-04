import Vuex from "vuex";
export default function install(Vue) {
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
    Vue.use(Vuex);
}
