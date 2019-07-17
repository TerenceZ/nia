import { ActionDispatcher, action } from './action'
import { noop } from './utils'

/**
 * Create an action used to communicate with other moddules or services.
 */
export function event<P = never>(): ActionDispatcher<
  never extends P ? [] : P extends unknown ? [] : [P],
  P,
  void
>

export function event<Args extends any[], P>(
  payloadCreator: (...args: Args) => P,
): ActionDispatcher<Args, P, void>

export function event(payloadCreator?: any) {
  return action(noop, payloadCreator)
}
