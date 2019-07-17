import { defineTagProperty } from './utils'
import Vue from 'vue'
import { getContext } from './context'
import assert from 'assert'

/**
 * @private
 */
export const VALUE_TAG = Symbol(
  process.env.NODE_ENV !== 'production' ? 'Value' : '',
)

/**
 * @private
 */
export const VALUE_GETTER_TAG = Symbol(
  process.env.NODE_ENV !== 'production' ? 'ValueGetter' : '',
)

export interface ValueWrapper<T> {
  [VALUE_TAG]: true
  value: T
}

/**
 * Define a reactive value wrapper.
 */
export function value<T = any>(): ValueWrapper<T | undefined>
export function value<T>(initial: T): ValueWrapper<T>
export function value<T>(initial?: any): any {
  if (initial && initial[VALUE_TAG]) {
    return initial
  }

  const value = {} as ValueWrapper<T>
  defineTagProperty(value, VALUE_TAG)
  ;(Vue as any).util.defineReactive(value, 'value', initial)

  if (process.env.NODE_ENV !== 'production') {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, 'value')!
    defineTagProperty(descriptor.get, VALUE_GETTER_TAG)
    Reflect.defineProperty(value, 'value', descriptor)

    const context = getContext()
    if (context.strict) {
      const runtime = context.runtime
      context.vm.$watch(
        () => value.value,
        () => {
          assert(
            (runtime.store as any)._committing,
            `do not mutate vuex store state outside mutation handlers.`,
          )
        },
        { deep: true, sync: true } as any,
      )
    }
  }

  Object.seal(value)
  return value
}

export function isValue(value: any): value is ValueWrapper<any> {
  return value && value[VALUE_TAG]
}

/**
 * @private
 */
export function isValueGetter(value: any) {
  return value && value[VALUE_GETTER_TAG]
}
