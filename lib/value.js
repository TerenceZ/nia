import { defineTagProperty } from "./utils";
import Vue from "vue";
import { getContext } from "./context";
import assert from "assert";
import { isPlainObject, mapValues, isArrayLike } from "lodash";
export const VALUE_TAG = Symbol(process.env.NODE_ENV !== "production" ? "Value" : "");
export const VALUE_GETTER_TAG = Symbol(process.env.NODE_ENV !== "production" ? "ValueGetter" : "");
export function value(initial) {
    if (initial && initial[VALUE_TAG]) {
        return initial;
    }
    const value = defineTagProperty(Vue.observable({
        value: initial
    }), VALUE_TAG);
    if (process.env.NODE_ENV !== "production") {
        const descriptor = Reflect.getOwnPropertyDescriptor(value, "value");
        descriptor.get = defineTagProperty(descriptor.get, VALUE_GETTER_TAG);
        Reflect.defineProperty(value, "value", descriptor);
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
export function unwrap(value, plain = false) {
    if (!value) {
        return value;
    }
    if (isValue(value)) {
        return value.value;
    }
    if (isPlainObject(value)) {
        if (plain) {
            return mapValues(value, unwrap);
        }
        const result = {};
        for (const prop in value) {
            if (Reflect.has(value, prop)) {
                unwrapProp(prop, value, result);
            }
        }
        return result;
    }
    if (isArrayLike(value)) {
        const result = [];
        for (let i = 0, n = value.length; i < n; ++i) {
            unwrapProp(value[i], value, result);
        }
        return result;
    }
    return value;
}
function unwrapProp(key, source, target) {
    const descriptor = Reflect.getOwnPropertyDescriptor(source, key);
    if (!descriptor.get) {
        if (descriptor.value) {
            if (isValue(descriptor.value)) {
                Reflect.defineProperty(target, key, Reflect.getOwnPropertyDescriptor(descriptor.value, "value"));
                return;
            }
            if (descriptor.value.__ob__) {
                Reflect.defineProperty(target, key, descriptor);
                return;
            }
        }
        descriptor.value = unwrap(descriptor.value);
    }
    Reflect.defineProperty(target, key, descriptor);
}
