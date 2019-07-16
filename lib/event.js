import { action } from "./action";
import { noop } from "./utils";
export function event(payloadCreator) {
    return action(noop, payloadCreator);
}
