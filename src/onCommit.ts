import { getContext } from './context'
import { subscribe } from './subscribe'

/**
 * Subscribe on each committed mutation.
 */
export function onCommit<P>(fn: (mutation: P, state: any) => void) {
  const runtime = getContext().runtime
  return subscribe(() => runtime.store.subscribe(fn as any))
}
