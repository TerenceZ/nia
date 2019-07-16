import { uniqueId, isFunction } from "lodash";
import { getContext } from "./context";
import { identity } from "./utils";
export function action(cb, creator) {
    const context = getContext();
    const type = uniqueId(`${(creator && creator.name) || cb.name || "a"}#`);
    const runtime = context.runtime;
    if (!creator) {
        creator = identity;
    }
    const action = function createAction() {
        return {
            type: type,
            payload: Reflect.apply(creator, null, arguments)
        };
    };
    action.type = type;
    action.toString = () => type;
    const dispatch = function dispatchAction() {
        return runtime.store.dispatch({
            type,
            payload: Reflect.apply(creator, null, arguments)
        });
    };
    dispatch.action = action;
    context.actions[type] = function onActionDispatch(store_, action) {
        const res = cb(action.payload);
        if (res && isFunction(res.then)) {
            return res.then((resolved) => {
                runtime.chan.put(action);
                return resolved;
            });
        }
        runtime.chan.put(action);
        return res;
    };
    return dispatch;
}
