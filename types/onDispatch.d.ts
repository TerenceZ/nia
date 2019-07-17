import { SubscribeActionOptions } from 'vuex';
/**
 * Subscribe on each dispatched action.
 */
export declare function onDispatch<P>(fn: SubscribeActionOptions<P, any>): () => void;
