import { ValueType } from "vue-tsx.macro";
import { Plugin } from "vuex";
import {
  ModelFactory,
  CombineGetters,
  CombineState,
  CombineActionCreators,
  ActionDispatcher
} from "./model";

export declare const SERVICES: unique symbol;

export interface Services {
  [SERVICES]: true;
  [key: string]: any;
}

export type StoreExtraOptions<State> = {
  plugins?: Plugin<State>[];
  strict?: boolean;
};

export interface ModelOptions<
  Data,
  State,
  Actions,
  Mutations,
  Modules,
  GettersDef,
  EffectsDef,
  SagasDef,
  ModelState = CombineState<State, Modules>,
  ModelGetters = CombineGetters<GettersDef, Modules>,
  ModelActionCreators = CombineActionCreators<
    Actions,
    Mutations,
    Modules,
    EffectsDef
  >,
  ModelDispatcher = ActionDispatcher<ModelActionCreators>
> {
  /**
   * The internal data (plain, not reactive) to store temp data,
   * or data across multiple functions.
   */
  data?: DataDefinition<Data>;
  /**
   *The public state (plain, reactive) to store data, across multiple
   * modules and components.
   */
  state?: StateDefinition<State>;
  /**
   * The actions used to communicate across multiple sagas (including
   * ancestors'), these actions will be only trigger root channel's `put()`.
   */
  actions?: ActionsDefinition<Actions>;
  /**
   * The computed state.
   */
  getters?: GettersDefinition<GettersDef, Data, ModelState, ModelGetters>;
  /**
   * The only way to update self state and they must be pure.
   * This function can only access self state, excluding submodules'.
   */
  mutations?: MutationsDefinition<Mutations, State>;
  /**
   * The functions to trigger side effects, it can be async functions,
   * normal functions, or saga functions.
   */
  effects?: EffectsDefinition<
    EffectsDef,
    Data,
    ModelState,
    ModelGetters,
    ModelActionCreators,
    ModelDispatcher
  >;
  /**
   * The functions to monitor some actions, trigger actions, they
   * may run forever, until the program exits. They are all saga functions.
   */
  sagas?: SagasDefinition<
    SagasDef,
    Data,
    ModelState,
    ModelGetters,
    ModelActionCreators,
    ModelDispatcher
  >;
  /**
   * The sub named models.
   */
  modules?: ModulesDefinition<Modules>;
}

// Data
export type DataDefinition<T> = T | (() => T);

// State
export type StateDefinition<T> = T | (() => T);

// Getters
export type GetterContext<Data, State, Getters> = {
  data: Data;
  state: State;
  getters: Getters;
  services: Services;
};

export type GettersDefinition<
  GettersDef,
  Data,
  State,
  ModelGetters
> = GettersDef & ThisType<GetterContext<Data, State, ModelGetters>>;

// Mutations
export type MutationContext<State> = {
  state: State;
};

export type MutationsDefinition<Mutations, State> = {
  [K in keyof Mutations]: Mutations[K] & ((payload: any) => void)
} &
  ThisType<MutationContext<State>>;

// Actions
export type ActionsDefinition<Actions> = {
  [K in keyof Actions]: ValueType<Actions[K]>
};

// Efects
export type EffectContext<Data, State, Getters, ActionCreators, Dispatcher> = {
  data: Data;
  state: State;
  getters: Getters;
  actions: ActionCreators;
  dispatch: Dispatcher;
  services: Services;
};

export type EffectsDefinition<
  EffectsDef,
  Data,
  State,
  Getters,
  ActionCreators,
  Dispatcher
> = EffectsDef &
  ThisType<EffectContext<Data, State, Getters, ActionCreators, Dispatcher>>;

// Sagas
export type SagasDefinition<
  SagasDef,
  Data,
  State,
  Getters,
  ActionCreators,
  Dispatcher
> = SagasDef &
  ThisType<EffectContext<Data, State, Getters, ActionCreators, Dispatcher>>;

export type ActionMap<Actions> = {
  [K in keyof Actions]: ValueType<Actions[K]>
};

// Modules
export type ModulesDefinition<Modules> = {
  [K in keyof Modules]: Modules[K] & ModelFactory
};
