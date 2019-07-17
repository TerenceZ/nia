import { computed } from './computed';
import { noop } from './utils';
export function getter(fn) {
    return computed(fn, noop);
}
