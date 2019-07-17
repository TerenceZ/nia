import { isValue } from './value';
import { isArray } from 'util';
import { getContext } from './context';
import { isFunction, eq } from 'lodash';
import assert from 'assert';
import { Watcher, noop } from './utils';
import { subscribe } from './subscribe';
export function watch(target, cb, opts = {}) {
    let getter;
    if (isArray(target)) {
        getter = createArrayWatchGetter(target);
    }
    else if (isValue(target)) {
        getter = createValueWatchGetter(target);
    }
    else {
        getter = target;
    }
    const context = getContext();
    const [update, clean] = createWatchUpdaterAndCleaner(cb);
    const vm = context.vm;
    return subscribe(() => {
        const watcher = new Watcher(vm, getter, update, {
            deep: opts.deep,
            sync: opts.flush === 'sync',
        });
        if (!opts.lazy) {
            update(watcher.value, undefined);
        }
        return () => {
            clean();
            watcher.teardown();
        };
    });
}
function createValueWatchGetter(wrapper) {
    return () => wrapper.value;
}
function createArrayWatchGetter(list) {
    let values;
    const getters = list.map(value => isFunction(value)
        ? value
        : createValueWatchGetter(value));
    return () => {
        let changed = values != null;
        const nextValues = [];
        for (let i = 0; i < getters.length; ++i) {
            nextValues[i] = getters[i]();
            changed = changed || !eq(nextValues[i], values[i]);
        }
        if (changed) {
            values = nextValues;
        }
        return values;
    };
}
function createWatchUpdaterAndCleaner(update) {
    let clean = noop;
    const cleaner = () => {
        const c = clean;
        clean = noop;
        if (c) {
            c();
        }
    };
    const onCleanup = (cb) => {
        if (process.env.NODE_ENV !== 'production') {
            assert(clean === noop, `[PANIC] Only one cleanup function can be set on one update call.`);
        }
        clean = cb;
    };
    const updater = (value, prevValue) => {
        cleaner();
        update(value, prevValue, onCleanup);
    };
    return [updater, cleaner];
}
