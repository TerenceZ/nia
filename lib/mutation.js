import { uniqueId } from "lodash";
import { action } from "./action";
import { getContext } from "./context";
/**
 * Create an actiton dispatcher with a mutation to trigger.
 */
export function mutation(mutation) {
    const context = getContext();
    const type = uniqueId(`${mutation.name || "m"}#`);
    const runtime = context.runtime;
    context.mutations[type] = function onMutationCommit(_, payload) {
        return mutation(payload);
    };
    return action(function commitMutation(payload) {
        runtime.store.commit(type, payload);
    });
}
