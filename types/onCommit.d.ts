/**
 * Subscribe on each committed mutation.
 */
export declare function onCommit<P>(fn: (mutation: P, state: any) => void): () => void;
