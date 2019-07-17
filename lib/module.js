import { unwrap } from './wrap';
/**
 * Use a module.
 */
export function module(mod, ...args) {
    return unwrap(Reflect.apply(mod, null, args));
}
