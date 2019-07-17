import Vue, { VueConstructor } from 'vue' // eslint-disable-line @typescript-eslint/no-unused-vars
import Vuex from 'vuex'

export function install(Vue: VueConstructor<Vue>) {
  const initStorePlugin = function() {
    const options = this.$options
    // store injection
    if (options.$) {
      this.$ = options.$
    } else if (options.parent && options.parent.$) {
      this.$ = options.parent.$
    }
  } as (this: Vue) => void

  Vue.mixin({ beforeCreate: initStorePlugin })
  Vue.use(Vuex)
}
