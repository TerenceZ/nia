import { ValueWrapper, isValue } from './value'
import { getContext } from './context'
import { isFunction, isArray, eq } from 'lodash'
import assert from 'assert'
import { Watcher, noop } from './utils'
import { subscribe } from './subscribe'

export interface WacthCallback<T, R> {
  (value: T, prevValue: T | undefined, onCleanup: (cb: () => void) => void): R
}

export type Watchable<T> = ValueWrapper<T> | (() => T)

export type UnwrapWatchable<T> = T extends Watchable<infer V> ? V : never

export type UnwrapWatchableList<T extends any[]> = {
  readonly [K in keyof T]: UnwrapWatchable<T[K]>
}

export type Writable<T> = { -readonly [K in keyof T]: T[K] }

export interface WatchOptions {
  lazy?: boolean
  deep?: boolean
  flush?: 'sync'
}

/**
 * Watch a target and react on its changes.
 */
export function watch<T, R>(
  target: Watchable<T>,
  cb: WacthCallback<T, R>,
  opts?: WatchOptions,
): () => void

export function watch<T extends readonly Watchable<any>[], R>(
  target: T,
  cb: WacthCallback<UnwrapWatchableList<Writable<T>>, R>,
  opts?: WatchOptions,
): () => void

export function watch<T extends Watchable<any>[], R>(
  target: T,
  cb: WacthCallback<UnwrapWatchableList<T>, R>,
  opts?: WatchOptions,
): () => void

export function watch(
  target: any,
  cb: WacthCallback<any, any>,
  opts: WatchOptions = {},
) {
  let getter: () => any
  if (isArray(target)) {
    getter = createArrayWatchGetter(target)
  } else if (isValue(target)) {
    getter = createValueWatchGetter(target)
  } else {
    getter = target
  }

  const context = getContext()
  const [update, clean] = createWatchUpdaterAndCleaner(cb)
  const vm = context.vm

  return subscribe(() => {
    const watcher = new Watcher(vm, getter, update, {
      deep: opts.deep,
      sync: opts.flush === 'sync',
    })

    if (!opts.lazy) {
      update(watcher.value, undefined)
    }

    return () => {
      clean()
      watcher.teardown()
    }
  })
}

function createValueWatchGetter<T>(wrapper: ValueWrapper<T>) {
  return () => wrapper.value
}

function createArrayWatchGetter(list: Watchable<any>[]) {
  let values: UnwrapWatchableList<typeof list> | undefined

  const getters = list.map(value =>
    isFunction(value)
      ? value
      : createValueWatchGetter(value as ValueWrapper<any>),
  )

  return () => {
    let changed = values != null
    const nextValues: any[] = []
    for (let i = 0; i < getters.length; ++i) {
      nextValues[i] = getters[i]()
      changed = changed || !eq(nextValues[i], values![i])
    }
    if (changed) {
      values = nextValues
    }
    return values
  }
}

function createWatchUpdaterAndCleaner(update: WacthCallback<any, any>) {
  let clean = noop

  const cleaner = () => {
    const c = clean
    clean = noop
    if (c) {
      c()
    }
  }

  const onCleanup = (cb: () => void) => {
    if (process.env.NODE_ENV !== 'production') {
      assert(
        clean === noop,
        `[PANIC] Only one cleanup function can be set on one update call.`,
      )
    }
    clean = cb
  }

  const updater = (value: any, prevValue: any) => {
    cleaner()
    update(value, prevValue, onCleanup)
  }

  return <const>[updater, cleaner]
}
