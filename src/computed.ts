import { ValueWrapper, VALUE_TAG, VALUE_GETTER_TAG } from "./value";
import { Watcher, Dep, defineTagProperty, noop } from "./utils";
import { getContext } from "./context";
import { mapValues, isFunction } from "lodash";

const COMPUTED_TAG = Symbol(
  process.env.NODE_ENV !== "production" ? "Computed" : ""
);

const COMPUTED_GETTER_TAG = Symbol(
  process.env.NODE_ENV !== "production" ? "ComputedGetter" : ""
);

const computedWatcherOptions = { lazy: true };
const computedPropertyOptions: PropertyDescriptor = {
  configurable: true,
  enumerable: true
};

export interface ComputedOptions<T = any> {
  get: () => T;
  set?: (value: T) => void;
}

/**
 * Define a computed value wrapper.
 */
export function computed<T>(
  get: () => T,
  set?: (value: T) => void
): ValueWrapper<T> {
  const context = getContext();
  const watcher = new Watcher(context.vm, get, noop, computedWatcherOptions);

  const computed = {};
  computedPropertyOptions.set = set;
  computedPropertyOptions.get = () => {
    if (watcher.dirty) {
      watcher.evaluate();
    }
    if (Dep.target) {
      watcher.depend();
    }
    return watcher.value;
  };

  if (process.env.NODE_ENV !== "production") {
    defineTagProperty(computedPropertyOptions.get, VALUE_GETTER_TAG);
    defineTagProperty(computedPropertyOptions.get, COMPUTED_GETTER_TAG);
  }

  Reflect.defineProperty(computed, "value", computedPropertyOptions);

  defineTagProperty(computed, VALUE_TAG);
  defineTagProperty(computed, COMPUTED_TAG);
  return computed as any;
}

/**
 * Define computed from map.
 */
export function computedMap<
  T extends Record<string, (() => any) | ComputedOptions>
>(
  map: T
): {
  [K in keyof T]: T[K] extends () => infer P
    ? ValueWrapper<P>
    : T[K] extends ComputedOptions<infer P>
    ? ValueWrapper<P>
    : never
} {
  return mapValues(map, (value: (() => any) | ComputedOptions) =>
    isFunction(value) ? computed(value) : computed(value.get, value.set)
  ) as any;
}

export function isComputed(value: any) {
  return value && value[COMPUTED_TAG];
}

export function isComputedGetter(value: any) {
  return value && value[COMPUTED_GETTER_TAG];
}
