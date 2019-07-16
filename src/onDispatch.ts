import { subscribe } from "./subscribe";
import { SubscribeActionOptions } from "vuex";
import { getContext } from "./context";

/**
 * Subscribe on each dispatched action.
 */
export function onDispatch<P>(fn: SubscribeActionOptions<P, any>) {
  const runtime = getContext().runtime;
  return subscribe(() => runtime.store.subscribeAction(fn as any));
}
