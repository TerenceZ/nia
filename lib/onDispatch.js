import { subscribe } from "./subscribe";
import { getContext } from "./context";
/**
 * Subscribe on each dispatched action.
 */
export function onDispatch(fn) {
    const runtime = getContext().runtime;
    return subscribe(() => runtime.store.subscribeAction(fn));
}
