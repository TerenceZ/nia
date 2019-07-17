import Vuex from 'vuex';
export function install(Vue) {
    const initStorePlugin = function () {
        const options = this.$options;
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
