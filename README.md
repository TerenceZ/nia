# VUEX-NIA

```ts
declare module "vuex-nia/types/options" {
  interface Services {
    context: number;
  }
}
```

```ts
import { model, bootstrap } from 'vuex-nia'
import { ActionsType } from 'vuex-nia/types/model'
import { put, delay, take } from 'redux-saga/effects'
import { Task } from 'redux-saga'
import Vue from 'vue'
import { type } from 'vue-tsx.macro'

const SubB = model({ /* ... */})

type Model = typeof Model
const Model = model({
  modules: {
    sub: model({
      getters: {
        a() {
          return 123
        }
      },
    }),
    subB: SubB,
  },
  // Data is used to store simple (not reactive) data locally,
  // useful to exchange state through sagas.
  data() {
    return {
      task_: <Task | null>null,
    }
  },
  // Define state.
  state() {
    return {
      count: 0,
    }
  },
  // Define getters.
  // You can access submodules' getters through `this.getters.SUB_MODULE_NAME.GETTER_NAME`,
  // even for deep submodules' getters through `this.getters.FIRST_SUB.SECOND_SUB.GETTER_NAME`.
  // State is just like the getters, e.g., `this.state.SUB_MODULE_NAME.STATE_NAME`.
  getters: {
    abc() {
      return this.state.count + this.getters.sub.a + this.services.context
    }
  },
  // Define action payload types used to notify sagas.
  actions: {
    b: type<void>(),
  },
  // Define state mutations.
  // In mutations, you cannot access any submodules' and actions / dispatch.
  mutations:  {
    a(inc: number) {
      // this.state is local, excluding submodules'.
      this.state.count += inc
    },
  },
  // Define side effects, it can be of saga, async function or normal function.
  // In effects, you can access actions, dispatch, state and getters, including submodules'.
  // Actions is just like the getters, e.g., `this.actions.SUB_MODULE_NAME.ACTION_NAME(payload)`.
  // Dispattch is just like the getters, e.g., `this.dispatch.SUB_MODULE_NAME.ACTION_NAME(payload)`.
  // actions are used to create action event object, not dispatching, it's useful for sagas to put.
  // dispatch are used to create action event and dispatch it.
  effects: {
    // No return value for saga.
    *delayA(count: number): any {
      yield delay(1000)
      yield put(this.actions.a(count))
    },
    async promiseA(count: number) {
      await new Promise(resolve => setTimeout(1000))
      this.dispatch.a(count)
      return count
    },
  }
  // Define sagas, see redux-saga.
  // In sagas, you can access actions, dispatch, state and getters, including submodules'.
  // Actions is just like the getters, e.g., `this.actions.SUB_MODULE_NAME.ACTION_NAME(payload)`.
  // Dispattch is just like the getters, e.g., `this.dispatch.SUB_MODULE_NAME.ACTION_NAME(payload)`.
  // actions are used to create action event object, not dispatching, it's useful for sagas to put.
  // dispatch are used to create action event and dispatch it.
  sagas: {
    *daemonA() {
      while (1) {
        const { payload } = (yield take(this.actions.a)) as ActionsType<Model>['a']
        console.log(`inc ${payload}`)
      }
    },
  }
})
// Subscribe things for model.
// In subscriptions, you can access actions, dispatch, state and getters, including submodules'.
// Actions is just like the getters, e.g., `this.actions.SUB_MODULE_NAME.ACTION_NAME(payload)`.
// Dispattch is just like the getters, e.g., `this.dispatch.SUB_MODULE_NAME.ACTION_NAME(payload)`.
// actions are used to create action event object, not dispatching, it's useful for sagas to put.
// dispatch are used to create action event and dispatch it.
.subscribe(model => {
  model.dispatch.delayA(123)
  model.dispatch.b()
})

// Create a store instance.
const store = bootstrap(Model, {
  // Inject data.
  services: {
    context: 567,
  }
})

// Access store through `this.$`.
const App = Vue.extend({
  render(h) {
    return h('div', [this.$.getters.abc])
  }
})

// Start app.
const app = new Vue({
  store: store.store,
  $: store,
  render: h => h(App),
}).$mount('#app')

```
