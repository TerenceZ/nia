import { Saga } from "redux-saga";
/**
 * Create a service to run.
 */
export declare function service(job: Saga<[]>): () => void;
