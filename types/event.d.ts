import { ActionDispatcher } from "./action";
/**
 * Create an action used to communicate with other moddules or services.
 */
export declare function event<P = never>(): ActionDispatcher<never extends P ? [] : P extends unknown ? [] : [P], P, void>;
export declare function event<Args extends any[], P>(payloadCreator: (...args: Args) => P): ActionDispatcher<Args, P, void>;
