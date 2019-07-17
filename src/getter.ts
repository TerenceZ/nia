import { computed } from './computed'
import { noop } from './utils'

export function getter<T>(fn: () => T) {
  return computed(fn, noop)
}
