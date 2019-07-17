import {
  Context,
  getContext,
  createDefaultContext,
  setContext,
} from './context'
import { Store as VuexStore, Plugin } from 'vuex'
import { RunSagaOptions, stdChannel, runSaga, Saga } from 'redux-saga'
import { isValue, isValueGetter } from './value'
import assert from 'assert'
import { isPlainObject, assign, bind, flowRight, map } from 'lodash'
import { isComputedGetter } from './computed'
import { all } from 'redux-saga/effects'
import { noop } from './utils'
import { Unwrap, unwrap } from './wrap'

export interface InitOptions<C extends Context = Context> {
  context?: () => C
  plugins?: Plugin<any>[]
  strict?: boolean
  saga?: RunSagaOptions<any, any>
}

export interface StoreExtraProps<T> {
  $store: VuexStore<any>
  $stop: () => void
  $reload: (module: () => T) => Store<T>
}

export type Store<T> = Unwrap<T> & StoreExtraProps<T>

/**
 * Init a module.
 */
export function init<T extends object, C extends Context>(
  mod: () => T,
  options: InitOptions<C> = {},
): Readonly<Store<T>> {
  if (process.env.NODE_ENV !== 'production') {
    assert(
      !getContext(),
      `[PANIC] Failed to invoke init() cannot because another init() is being called.`,
    )
  }

  try {
    const context = setContext(
      (options.context && options.context()) || createDefaultContext(),
    )
    context.strict = !!options.strict

    // Initialize module.
    const instance: any = mod()

    // Create a vuex store to act as an event emitter,
    // and expose things on devtool.
    const vstore = new VuexStore({
      ...extractStoreOptionsFromModule(instance),
      actions: context.actions,
      mutations: context.mutations,
      plugins: options.plugins,
    })

    // Init runtime.
    const chan = stdChannel()
    const runtime = context.runtime
    runtime.chan = chan
    runtime.store = vstore

    // Run context actions.
    const stopActions = runContextActions(context, options)

    // Inject extra props.
    const vm = context.vm
    const store = unwrap(instance, false) as Store<T>
    store.$store = vstore

    store.$stop = () => {
      store.$stop = noop
      stopActions()
      vm.$destroy()
    }

    store.$reload = createHotReload(store, options)
    if (process.env.NODE_ENV !== 'production') {
      Reflect.preventExtensions(store)
    } else {
      Object.seal(store)
    }
    return store
  } finally {
    setContext(null!)
  }
}

function extractStoreOptionsFromModule<T extends object>(mod: T) {
  const state: any = {}
  const getters: any = {}
  if (process.env.NODE_ENV !== 'production') {
    const walk = (obj: any, path: string[]) => {
      for (const prop in obj) {
        if (Reflect.has(obj, prop)) {
          let descriptor = Reflect.getOwnPropertyDescriptor(obj, prop)!
          const key = path.length ? `${path.join('/')}/${prop}` : prop
          if (!descriptor.get) {
            const value = descriptor.value
            if (value) {
              if (isValue(value)) {
                descriptor = Reflect.getOwnPropertyDescriptor(value, 'value')!
              } else {
                if (value.__ob__) {
                  Reflect.defineProperty(state, key, descriptor)
                  continue
                }
                if (isPlainObject(value)) {
                  walk(value, [...path, prop])
                  continue
                }
              }
            }
          }

          if (isComputedGetter(descriptor.get)) {
            getters[key] = descriptor.get
          } else if (isValueGetter(descriptor.get)) {
            Reflect.defineProperty(state, key, descriptor)
          }
        }
      }
    }

    walk(mod, [])
  }
  return { state, getters }
}

function runContextActions<C extends Context>(
  context: C,
  options: InitOptions<C>,
) {
  const runtime = context.runtime

  // Start sagas.
  const task = runSaga(
    assign(
      {
        channel: runtime.chan,
        dispatch: bind(runtime.store.dispatch, runtime.store),
      },
      options.saga,
    ),
    createRootSaga(context.services as any[]),
  )

  // Invoke subscriptions.
  const unsub = flowRight(context.subs.map(sub => sub() || noop))

  return () => {
    unsub()
    task.cancel()
  }
}

function createRootSaga(sagas: Saga[]): Saga {
  return function* rootSaga() {
    yield all(map(sagas, saga => saga()))
  }
}

function createHotReload<T>(store: Store<T>, options: InitOptions<any>) {
  return (mod: () => T) => {
    if (process.env.NODE_ENV === 'production') {
      return store
    }

    try {
      store.$stop()

      const context = setContext(
        (options.context && options.context()) || createDefaultContext(),
      )

      // Initialize module.
      const instance: any = mod()

      // Hot update store.
      store.$store.hotUpdate({
        ...extractStoreOptionsFromModule(instance),
        actions: context.actions,
        mutations: context.mutations,
      })

      // Init runtime.
      const chan = stdChannel()
      const runtime = context.runtime
      runtime.chan = chan
      runtime.store = store.$store

      // Run context actions.
      const stopActions = runContextActions(context, options)

      // Inject extra props.
      const vm = context.vm
      const nextStore = unwrap(instance) as T & StoreExtraProps<T>

      // Copy new module props into store.
      for (const prop in nextStore) {
        if (Reflect.has(nextStore, prop)) {
          Reflect.defineProperty(
            store,
            prop,
            Reflect.getOwnPropertyDescriptor(nextStore, prop)!,
          )
        }
      }

      // Bind new stop.
      store.$stop = () => {
        store.$stop = noop
        stopActions()
        vm.$destroy()
      }

      return store
    } finally {
      setContext(null!)
    }
  }
}
