import { uniqueId, isFunction } from 'lodash'
import { getContext } from './context'
import { identity } from './utils'

export interface Action<P> {
  type: string
  payload: P
}

export type PayloadFromArgs<Args extends any[]> = Args extends [infer P]
  ? P
  : never

export interface ActionCreator<Args extends any[], P> {
  (...args: Args): Action<P>
  toString(): string
  type: string
}

export interface ActionDispatcher<Args extends any[], P, R> {
  (...args: Args): Promise<R>
  action: ActionCreator<Args, P>
}

/**
 * Create an action dispatcher, with callback.
 */
export function action<Args extends any[], R>(
  callback: (...args: Args) => R,
): ActionDispatcher<Args, PayloadFromArgs<Args>, R>

export function action<Args extends any[], P, R>(
  callback: (payload: P) => R,
  payloadCreator: (...args: Args) => P,
): ActionDispatcher<Args, P, R>

export function action(
  cb: any,
  creator?: any,
): ActionDispatcher<any[], any, any> {
  const context = getContext()

  const type = uniqueId(`${(creator && creator.name) || cb.name || 'a'}#`)
  const runtime = context.runtime

  if (!creator) {
    creator = identity
  }

  const action = function createAction() {
    return {
      type: type,
      payload: Reflect.apply(creator, null, arguments),
    }
  }

  action.type = type
  action.toString = () => type

  const dispatch = function dispatchAction() {
    return runtime.store.dispatch({
      type,
      payload: Reflect.apply(creator, null, arguments),
    })
  }
  dispatch.action = action

  context.actions[type] = function onActionDispatch(store_: any, action: any) {
    const res = cb(action.payload)
    if (res && isFunction(res.then)) {
      return res.then((resolved: any) => {
        runtime.chan.put(action)
        return resolved
      })
    }

    runtime.chan.put(action)
    return res
  }
  return dispatch as any
}
