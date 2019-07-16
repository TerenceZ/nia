import { getContext } from "./context";
import Vue from "vue";
import assert from "assert";

/**
 * Define a reactive state object.
 */
export function state<T extends object>(target: T) {
  const state = Vue.observable(target);

  if (process.env.NODE_ENV !== "production" && getContext().strict) {
    const context = getContext();
    const runtime = context.runtime;
    context.vm.$watch(
      () => state,
      () => {
        assert(
          (runtime.store as any)._committing,
          `do not mutate vuex store state outside mutation handlers.`
        );
      },
      { deep: true, sync: true } as any
    );
  }

  return state;
}
