import { defineTagProperty } from './utils';
import Vue from 'vue';
import { getContext } from './context';
import assert from 'assert';
/**
 * @private
 */
export const VALUE_TAG = Symbol(process.env.NODE_ENV !== 'production' ? 'Value' : '');
/**
 * @private
 */
export const VALUE_GETTER_TAG = Symbol(process.env.NODE_ENV !== 'production' ? 'ValueGetter' : '');
export function value(initial) {
    if (initial && initial[VALUE_TAG]) {
        return initial;
    }
    const value = {};
    defineTagProperty(value, VALUE_TAG);
    Vue.util.defineReactive(value, 'value', initial);
    if (process.env.NODE_ENV !== 'production') {
        const descriptor = Reflect.getOwnPropertyDescriptor(value, 'value');
        defineTagProperty(descriptor.get, VALUE_GETTER_TAG);
        Reflect.defineProperty(value, 'value', descriptor);
        const context = getContext();
        if (context.strict) {
            const runtime = context.runtime;
            context.vm.$watch(() => value.value, () => {
                assert(runtime.store._committing, `do not mutate vuex store state outside mutation handlers.`);
            }, { deep: true, sync: true });
        }
    }
    Object.seal(value);
    return value;
}
export function isValue(value) {
    return value && value[VALUE_TAG];
}
/**
 * @private
 */
export function isValueGetter(value) {
    return value && value[VALUE_GETTER_TAG];
}
