/**
 * Create an actiton dispatcher with a mutation to trigger.
 */
export declare function mutation<Args extends any[]>(mutation: (...args: Args) => void): import("./action").ActionDispatcher<Args, import("./action").PayloadFromArgs<Args>, void>;
