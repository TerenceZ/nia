# VUEX-NIA

```ts
import {
  state,
  value,
  getter,
  mutation,
  action,
  event,
  subscribe,
  watch,
  service,
  wrap,
  unwrap,
  init,
  computed,
} from 'vuex-nia'
import { put, delay, take } from 'redux-saga/effects'
import { Task } from 'redux-saga'
import Vue from 'vue'

interface CustomContext {
  // custom members.
  a: number
}

function SubModule(context: CustomContext) {
  const someState = state({ a: 0 /* ... */ })

  // acccess value through `someValue.value`
  const someValue = value(0)

  // acccess value through `someGetter.value`
  const someGetter = getter(() => someValue.value + someState.a)

  // all states / values can be modified only in mutation,
  // if strict mode enables.
  const someMutation = mutation((payload: number) => {
    someValue.value += payload
  })

  const someAction = action((payload: number) => {
    // dispatch action to trigger mutation.
    someMutation(payload + someGetter.value)
  })

  // computed value.
  const someComputed = computed(
    () => someValue.value,
    value => {
      someMutation()
    },
  )

  const someActionWithPayloadCreator = action(
    payload => {
      someMutation(payload + someComputed.value)
    },
    (a: number, b: number) => a + b,
  )

  const someAsyncAction = action(async (payload: number) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    someAction(payload)
    return payload
  })

  // `someEventAction()` will dispatch an action with
  // empty payload and unique action type.
  const someEventAction = event()

  // `someEventActionWithPayloadCreator(1, 2)` will dispatch an action with
  // `payload=3` and unique action type.
  const someEventActionWithPayloadCreator = event(
    (a: number, b: number) => a + b,
  )

  // Subscriptions are invoked after init().
  subscribe(() => {
    somoeAsyncAction(123).then(result => {
      console.log(result) // 123
    })
  })

  // Watchers are invoked after init() if no lazy specified.
  // watch(wrappedValue, callback)
  watch(someValue, value => {
    console.log(value) // value will be unwrapped.
  })

  // watch(fn, callback)
  // unwatch() will be auto invoked when store stops.
  const unwtach = watch(
    () => someState,
    value => {
      console.log(value)
    },
  )

  // watch(mixed fns and wrapped values, callback)
  watch(
    // without `as const`, the callback arg types are not accurated.
    [someValue, someGetter, () => someState] as const,
    ([value0, value1, value2]) => {
      console.log(value0, value1, value2)
    },
  )

  // Services are invoked through `runSaga()` after init().
  service(function*() {
    while (1) {
      // dispatcher.action is a function to create action (not dispatch),
      // and due to `toString()` redefined on it, we can use it in `take()`.
      const { payload } = yield take(someAction.action)
      yield delay(1000)
      // create an action to put.
      yield put(someEventAction.action(payload * 2))
    }
  })

  // export what to expose.
  return {
    // You can only expose what you want, no needs for all.
    someAction,
    someAsyncAction,

    someState,
    someComputed,

    // You should explcit unwrap nested props with value,
    // because init() and module() will only unwrap exports' own props.
    deeperProps: unwrap({
      someEvent,
      someValue,
    }),
  }
}

function RootModule(context: CustomContext) {
  // import things from SubModule.
  const sub = module(SubModule, context)

  // You can use module more than once.
  const aotherSub = module(SubModule, { a: 567 })

  const someRootState = state({
    /* ... */
  })

  subscribe(() => {
    console.log(sub.someValue)
  })

  service(function*() {
    while (1) {
      const { payload } = yield take(sub.deeperProps.someEvent)
      console.log(payload)
    }
  })

  return {
    someRootState,
    anotherSub,
    // if you want to spread modules, you should
    // wrap it back firstly, otherwise, the spread
    // values are not reactive.
    ...wrap(sub),
  }
}

// Create a store instance.
const store = init(() => RootModule({ a: 123 }), {
  plugins: [
    /* Vuex Store Plugins */
  ],
  strict: true, // restrict state / value updates only in mutation.
  saga: {
    /* runSagaOptions, see redux-saga document. */
  },
})

// Access store through `this.$`.
const App = Vue.extend({
  render(h) {
    const someRootState = this.$.someRootState
    // do something...
    return h(
      'div',
      {
        on: {
          click() {
            this.$.someAction(123)
          },
        },
      },
      [this.$.someValue, this.$.anotherSub.someValue],
    )
  },
})
// Start app.
const app = new Vue({
  // for vuex
  store: store.$store,
  $: store,
  render: h => h(App),
}).$mount('#app')
```
