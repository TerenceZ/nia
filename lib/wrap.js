import { isValue, VALUE_TAG } from './value';
import assert from 'assert';
import { isPlainObject } from 'lodash';
import { defineTagProperty } from './utils';
export function wrap(value) {
    if (process.env.NODE_ENV !== 'production') {
        assert(value, `[PANIC] Falsy value cannot be wrapped.`);
        assert(!isValue(value), `[PANIC] Value wrapper cannot be wrapped.`);
        assert(isPlainObject(value), `[PANIC] Only plain object can be wrapped.`);
    }
    const result = {};
    for (const prop in value) {
        if (Reflect.has(value, prop)) {
            const descriptor = Reflect.getOwnPropertyDescriptor(value, prop);
            if (isValue(descriptor.value)) {
                Reflect.defineProperty(result, prop, descriptor);
            }
            else {
                const wrapped = defineTagProperty({}, VALUE_TAG);
                Reflect.defineProperty(wrapped, 'value', descriptor);
                result[prop] = wrapped;
            }
        }
    }
    return result;
}
export function unwrap(value) {
    if (process.env.NODE_ENV !== 'production') {
        assert(value, `[PANIC] Falsy value cannot be unwrapped.`);
        assert(!isValue(value), `[PANIC] Value wrapper cannot be unwrapped.`);
        assert(isPlainObject(value), `[PANIC] Only plain object can be unwrapped.`);
    }
    const result = {};
    for (const prop in value) {
        if (Reflect.has(value, prop)) {
            let descriptor = Reflect.getOwnPropertyDescriptor(value, prop);
            if (isValue(descriptor.value)) {
                descriptor = Reflect.getOwnPropertyDescriptor(descriptor.value, 'value');
            }
            Reflect.defineProperty(result, prop, descriptor);
        }
    }
    return result;
}
