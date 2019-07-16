import { uniqueId } from "lodash";
import { action } from "./action";
import { getContext } from "./context";

/**
 * Create an actiton dispatcher with a mutation to trigger.
 */
export function mutation<Args extends any[]>(
  mutation: (...args: Args) => void
) {
  const context = getContext();
  const type = uniqueId(`${mutation.name || "m"}#`);
  const runtime = context.runtime;

  context.mutations[type] = function onMutationCommit(_: any, payload: any) {
    return (mutation as any)(payload);
  };

  return action<Args, void>(function commitMutation(payload: any) {
    runtime.store.commit(type, payload);
  } as any);
}
