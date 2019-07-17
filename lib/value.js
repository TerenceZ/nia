import { defineTagProperty } from './utils';
import Vue from 'vue';
import { getContext } from './context';
import assert from 'assert';
export const VALUE_TAG = Symbol(process.env.NODE_ENV !== 'production' ? 'Value' : '');
export const VALUE_GETTER_TAG = Symbol(process.env.NODE_ENV !== 'production' ? 'ValueGetter' : '');
export function value(initial) {
    if (initial && initial[VALUE_TAG]) {
        return initial;
    }
    const value = defineTagProperty(Vue.observable({
        value: initial,
    }), VALUE_TAG);
    const descriptor = Reflect.getOwnPropertyDescriptor(value, 'value');
    defineTagProperty(descriptor.get, VALUE_GETTER_TAG);
    Reflect.defineProperty(value, 'value', descriptor);
    if (process.env.NODE_ENV !== 'production') {
        const context = getContext();
        if (context.strict) {
            const runtime = context.runtime;
            context.vm.$watch(() => value.value, () => {
                assert(runtime.store._committing, `do not mutate vuex store state outside mutation handlers.`);
            }, { deep: true, sync: true });
        }
    }
    return value;
}
export function isValue(value) {
    return value && value[VALUE_TAG];
}
export function isValueGetter(value) {
    return value && value[VALUE_GETTER_TAG];
}
