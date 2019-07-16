import { unwrap } from "./value";

/**
 * Use a module.
 */
export function module<A extends any[], T>(mod: (...args: A) => T, ...args: A) {
  return unwrap<T>(Reflect.apply(mod, null, args));
}
