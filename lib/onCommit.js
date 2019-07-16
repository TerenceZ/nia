import { getContext } from "./context";
import { subscribe } from "./subscribe";
/**
 * Subscribe on each committed mutation.
 */
export function onCommit(fn) {
    const runtime = getContext().runtime;
    return subscribe(() => runtime.store.subscribe(fn));
}
