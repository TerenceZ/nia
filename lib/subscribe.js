import { getContext } from './context';
import { noop } from './utils';
/**
 * Add function to run after init.
 */
export function subscribe(fn) {
    let stopped = false;
    let unsub = noop;
    getContext().subs.push(() => {
        if (stopped) {
            return;
        }
        unsub = fn() || noop;
    });
    return () => {
        stopped = true;
        const unsub_ = unsub;
        unsub = noop;
        unsub_();
    };
}
