import { ValueWrapper, isValue, VALUE_TAG } from './value'
import assert from 'assert'
import { isPlainObject } from 'lodash'
import { defineTagProperty } from './utils'

export type Wrap<T> = {
  [K in keyof T]: T[K] extends ValueWrapper<any> ? T[K] : ValueWrapper<T[K]>
}

export type Unwrap<T> = {
  [K in keyof T]: T[K] extends ValueWrapper<infer V> ? V : T[K]
}

export function wrap<T extends object>(
  value: T,
): {
  [K in keyof T]: T[K] extends ValueWrapper<any> ? T[K] : ValueWrapper<T[K]>
}

export function wrap(value: any): any {
  if (process.env.NODE_ENV !== 'production') {
    assert(value, `[PANIC] Falsy value cannot be wrapped.`)
    assert(!isValue(value), `[PANIC] Value wrapper cannot be wrapped.`)
    assert(isPlainObject(value), `[PANIC] Only plain object can be wrapped.`)
  }

  const result: any = {}
  for (const prop in value) {
    if (Reflect.has(value, prop)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, prop)!
      if (isValue(descriptor.value)) {
        Reflect.defineProperty(result, prop, descriptor)
      } else {
        const wrapped = defineTagProperty({}, VALUE_TAG)
        Reflect.defineProperty(wrapped, 'value', descriptor)
        result[prop] = wrapped
      }
    }
  }

  Object.seal(result)
  return result
}

export function unwrap<T extends object>(value: T): Unwrap<T>
export function unwrap(value: any) {
  if (process.env.NODE_ENV !== 'production') {
    assert(value, `[PANIC] Falsy value cannot be unwrapped.`)
    assert(!isValue(value), `[PANIC] Value wrapper cannot be unwrapped.`)
    assert(isPlainObject(value), `[PANIC] Only plain object can be unwrapped.`)
  }
  const result = {}
  for (const prop in value) {
    if (Reflect.has(value, prop)) {
      let descriptor = Reflect.getOwnPropertyDescriptor(value, prop)!
      if (isValue(descriptor.value)) {
        descriptor = Reflect.getOwnPropertyDescriptor(
          descriptor.value,
          'value',
        )!
      }
      Reflect.defineProperty(result, prop, descriptor)
    }
  }

  Object.seal(result)
  return result
}
