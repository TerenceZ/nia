import { unwrap } from './wrap'

/**
 * Use a module.
 */
export function module<A extends any[], T extends object>(
  mod: (...args: A) => T,
  ...args: A
) {
  return unwrap<T>(Reflect.apply(mod, null, args))
}
