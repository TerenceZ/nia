export interface Action<P> {
    type: string;
    payload: P;
}
export declare type PayloadFromArgs<Args extends any[]> = Args extends [infer P] ? P : never;
export interface ActionCreator<Args extends any[], P> {
    (...args: Args): Action<P>;
    toString(): string;
    type: string;
}
export interface ActionDispatcher<Args extends any[], P, R> {
    (...args: Args): Promise<R>;
    action: ActionCreator<Args, P>;
}
/**
 * Create an action dispatcher, with callback.
 */
export declare function action<Args extends any[], R>(callback: (...args: Args) => R): ActionDispatcher<Args, PayloadFromArgs<Args>, R>;
export declare function action<Args extends any[], P, R>(callback: (payload: P) => R, payloadCreator: (...args: Args) => P): ActionDispatcher<Args, P, R>;
