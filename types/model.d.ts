import { Saga, MulticastChannel } from "redux-saga";
import { StoreOptions, Store } from "vuex";
import { UnionToIntersection } from "vue-tsx.macro";
import { ActionMap, Services } from "./options";

// Model
export interface RootModelIO {
  channel: MulticastChannel<any>;
  dispatch<T extends string, P = any, R = any>(action: Action<T, P>): R;
}

export type RootModel<M extends Model = Model, S = M["state"]> = M & {
  store: Store<S>;
  io: RootModelIO;
  stop(): void;
};

export type SubscriptionContext<M extends Model, Data> = Omit<
  M,
  "subscribe" | "saga"
> & {
  data: Data;
  onStoreCommit: Store<any>["subscribe"];
  onStoreDispatch: Store<any>["subscribeAction"];
  watch: Store<any>["watch"];
};

export interface ModelSaga {
  saga: Saga;
  ctx: any;
  action?: string;
}

export interface ModelSub {
  sub: Function;
  ctx: any;
}

export interface Model<State = any, Getters = any, ActionCreators = any> {
  namespace: string[];
  state: State;
  getters: Getters;
  actions: ActionCreators;
  dispatch: ActionDispatcher<ActionCreators>;
  services: Services;
  sagas: ModelSaga[];
  subs: ModelSub[];
}

export interface ModelBindOptions<S = any, A = any> {
  namespace: string[];
  services: Services;
  store: Store<S>;
  state: S;
  channel: MulticastChannel<A>;
}

export interface ModelFactory<
  M extends Model = Model,
  D = any,
  A = M["actions"]
> {
  configure(): {
    store: StoreOptions<any>;
    bind(options: ModelBindOptions): M;
  };
  subscribe(
    sub: (context: SubscriptionContext<M, D>) => void | (() => void)
  ): this;
  actions: A;
}

export type ModelBindContext<S> = Pick<
  Store<S>,
  "state" | "commit" | "dispatch" | "getters"
>;

// Getters
export type GettersType<M> = M extends ModelFactory<Model<any, infer G>>
  ? G
  : M extends Model<any, infer G>
  ? M
  : unknown;

export type CombineGetters<GettersDef, Modules> = {
  [K in keyof GettersDef]: GettersDef[K] extends () => infer R ? R : never
} &
  { [K in keyof Modules]: GettersType<Modules[K]> };

// State
export type StateType<M> = M extends ModelFactory<Model<infer S>>
  ? S
  : M extends Model<infer S>
  ? S
  : unknown;

export type CombineState<State, Modules> = State &
  { [K in keyof Modules]: StateType<Modules[K]> };

// Actions
export type ActionsType<M> = ActionsTypeForCreators<ActionCreatorsType<M>>;

export type ActionsTypeForCreators<C> = {
  [K in keyof C]: C[K] extends ActionCreator<any, any, any>
    ? ReturnType<C[K]>
    : ActionsTypeForCreators<C[K]>
};

// Action creators
export declare const ACTION_CREATOR: unique symbol;

export interface Action<Type, Payload> {
  type: Type;
  payload: Payload;
}

export type ActionCreator<
  Type = string,
  Args extends any[] = [],
  DispatchResult = any
> = {
  (...args: Args): Action<Type, PayloadForArgs<Args>>;
  toString(): Type;
  [ACTION_CREATOR]: DispatchResult;
};

export type PayloadForArgs<T extends any[]> = T extends []
  ? void
  : T extends (infer K)[]
  ? K
  : never;

export type ActionCreatorsType<M> = M extends ModelFactory<
  Model<any, any, infer A>
>
  ? A
  : M extends Model<any, any, infer A>
  ? A
  : unknown;

export type CombineActionCreators<
  Actions,
  Mutations,
  Modules,
  EffectsDef
> = ActionCreatorsForActions<Actions> &
  ActionCreatorsForMutations<Mutations> &
  ActionCreatorsForModules<Modules> &
  ActionCreatorsForEffects<EffectsDef>;

export type ActionCreatorsForActions<Actions> = {
  [K in keyof Actions]: ActionCreator<
    K,
    unknown extends Actions[K] ? [] | [Actions[K]] : [Actions[K]],
    void
  >
};

export type ActionCreatorsForMutations<Mutations> = {
  [K in keyof Mutations]: ActionCreator<
    K,
    Mutations[K] extends (...args: infer A) => void ? A : never,
    void
  >
};

export type ActionCreatorsForEffects<Effects> = UnionToIntersection<
  ActionCreatorForEffect<Effects>
>;

export type ActionCreatorForEffect<Effect> = Effect extends Function
  ? {}
  : ActionCreatorsForEffectMap<Effect>;

export type ActionCreatorsForEffectMap<Effect> = {
  [K in keyof Effect]: Effect[K] extends (
    ...args: infer A
  ) => IterableIterator<any>
    ? ActionCreator<K, A, void>
    : Effect[K] extends (...args: infer A) => infer Result
    ? ActionCreator<
        K,
        A,
        Result extends PromiseLike<any> ? Result : Promise<Result>
      >
    : never
};

export type ActionCreatorsForModules<Modules> = {
  [K in keyof Modules]: ActionCreatorsType<Modules[K]>
};

// Dispatcher
export type ActionDispatcher<A> = UnionToIntersection<
  {
    [K in keyof A]: A[K] extends ActionCreator<
      infer Type,
      infer Args,
      infer Result
    >
      ? (action: Action<Type, PayloadForArgs<Args>>) => Result
      : ActionDispatcher<A[K]>
  }[keyof A]
> &
  ActionDispatcherTree<A>;

export type ActionDispatcherTree<A> = {
  [K in keyof A]: A[K] extends ActionCreator<
    infer Type,
    infer Args,
    infer Result
  >
    ? (...args: Args) => Result
    : ActionDispatcherTree<A[K]>
};
