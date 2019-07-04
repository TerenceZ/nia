import {
  init as initApi,
  hotReload as hotReloadApi,
  model as modelApi,
  bootstrap as bootstrapApi,
  EnhancedRootModel
} from "../types/api";
import { Store } from "vuex";
import {
  merge,
  map,
  mapKeys,
  mapValues,
  uniqueId,
  forOwn,
  isFunction,
  keys,
  intersection,
  forEach,
  reduce,
  filter,
  concat,
  noop,
  isArray,
  reverse,
  compact,
  assign,
  pick
} from "lodash";
import { stdChannel, MulticastChannel, Saga, END, runSaga } from "redux-saga";
import { fork, all, take } from "redux-saga/effects";
import { RootModel, RootModelIO, Model } from "../types/model";
import assert from "assert";

interface ModelContext {
  m: Model;
  c: MulticastChannel<any>;
}

function isGeneratorFunction(fn: Function): fn is GeneratorFunction {
  return Object.prototype.toString.call(fn) === "[object GeneratorFunction]";
}

function createIO<S>(store: Store<any>, channel: MulticastChannel<any>) {
  return {
    channel,
    dispatch: createModelDispatcher(
      process.env.NODE_ENV !== "production" ? "root" : "",
      store
    )
  } as RootModelIO;
}

function createModelDispatcher(namespace: string, store: Store<any>) {
  const fn = <T extends { type: string }>(action: T) => store.dispatch(action);
  if (process.env.NODE_ENV !== "production") {
    Object.defineProperty(fn, "name", {
      configurable: true,
      enumerable: false,
      writable: false,
      value: `model/dispach:${namespace}`
    });
  }
  return fn;
}

function createActionDispatcher(store: Store<any>, type: string) {
  const fn = (payload: any) => store.dispatch({ type, payload });

  if (process.env.NODE_ENV !== "production") {
    Object.defineProperty(fn, "name", {
      configurable: true,
      enumerable: false,
      writable: false,
      value: `action/dispatch:${type}`
    });
  }
  return fn;
}

function createEffectsStoreActions(
  effects: Record<string, Function>,
  keyMap: Record<string, string>,
  context: ModelContext
) {
  const dispatcher = (store_: any, action: any) => {
    context.c.put(action);
  };

  return reduce(
    keyMap,
    (actions, key, name) => {
      let fn: Function;
      if (isGeneratorFunction(effects[name])) {
        fn =
          process.env.NODE_ENV !== "production"
            ? createSagaDispatcher(context, `effect/dispatch:${key}`)
            : dispatcher;
      } else {
        fn = wrapEffect(effects[name], context, key);
      }
      actions[key] = fn;
      return actions;
    },
    {} as Record<string, Function>
  );
}

function createMutationEffect(
  name: string,
  type: string,
  context: ModelContext
) {
  const fn = (store: Store<any>, action: any) => {
    store.commit(type, action.payload);
    context.c.put(action);
  };

  if (process.env.NODE_ENV !== "production") {
    Object.defineProperty(fn, "name", {
      configurable: true,
      enumerable: false,
      writable: false,
      value: `mutation/effect:${name}`
    });
  }
  return fn;
}

function createMutationsStoreActions(
  effectKeyMap: Record<string, string>,
  mutationKeyMap: Record<string, string>,
  context: ModelContext
) {
  return mapKeys(
    mapValues(mutationKeyMap, (mutationKey, name) =>
      createMutationEffect(name, mutationKey, context)
    ),
    (fn_, name) => effectKeyMap[name]
  );
}

function createActionEffect(name: string, type: string, context: ModelContext) {
  const fn = (store: Store<any>, action: any) => {
    context.c.put(action);
  };

  if (process.env.NODE_ENV !== "production") {
    Object.defineProperty(fn, "name", {
      configurable: true,
      enumerable: false,
      writable: false,
      value: `action/effect:${name}`
    });
  }
  return fn;
}

function createActionsStoreActions(
  keyMap: Record<string, string>,
  context: ModelContext
) {
  return mapKeys(
    mapValues(keyMap, (key, name) => createActionEffect(name, key, context)),
    (fn_, name) => keyMap[name]
  );
}

function wrapGetter(fn: Function, context: ModelContext, name: string) {
  const wrapped = () => fn.call(context.m, context.m);

  if (process.env.NODE_ENV !== "production") {
    Object.defineProperty(wrapped, "name", {
      configurable: true,
      enumerable: false,
      writable: false,
      value: `getter:${name}`
    });
  }
  return wrapped;
}

function wrapMutation(fn: Function, context: ModelContext, name: string) {
  const wrapped = (state_: any, payload: any) =>
    fn.call(context.m, context.m, payload);

  if (process.env.NODE_ENV !== "production") {
    Object.defineProperty(wrapped, "name", {
      configurable: true,
      enumerable: false,
      writable: false,
      value: `mutation:${name}`
    });
  }
  return wrapped;
}

function wrapEffect(fn: Function, context: ModelContext, name: string) {
  const wrapped = (store_: any, action: any) => {
    const res = fn.call(context.m, context.m, action.payload);
    context.c.put(action);
    return res;
  };

  if (process.env.NODE_ENV !== "production") {
    Object.defineProperty(wrapped, "name", {
      configurable: true,
      enumerable: false,
      writable: false,
      value: `effect:${name}`
    });
  }
  return wrapped;
}

function createSagaDispatcher(context: ModelContext, name?: string) {
  const dispatcher = (vctx_: any, action: any) => {
    context.c.put(action);
  };

  if (process.env.NODE_ENV !== "production" && name) {
    Object.defineProperty(dispatcher, "name", {
      configurable: true,
      enumerable: false,
      writable: false,
      value: name
    });
  }
  return dispatcher;
}

function createModelSagas(
  services: Saga[],
  effects: Record<string, Function>,
  keyMap: Record<string, string>
) {
  return concat(
    filter(
      map(effects, (effect, name) => [keyMap[name], effect]) as any,
      ([name_, effect]) => isGeneratorFunction(effect)
    ),
    map(services, service => [null, service])
  );
}

function wrapForkSaga(saga: Saga, context: ModelContext, key: string | null) {
  const wrapped = (action: any) =>
    fork([context.m, saga], context.m, action.payload);
  if (process.env.NODE_ENV !== "production" && (key || saga.name)) {
    Object.defineProperty(wrapped, "name", {
      configurable: true,
      enumerable: false,
      writable: false,
      value: `saga/fork:${key || saga.name}`
    });
  }
  return wrapped;
}

function* noeff(): IterableIterator<any> {
  // do nothing.
}

function combineSubscriptions(subs: Function[]): any {
  subs = filter(subs, sub => sub !== noop);
  if (!subs.length) {
    return noop;
  }

  if (subs.length === 1) {
    return subs[0];
  }

  return () => {
    const unsubs = reverse(compact(map(subs, sub => sub())));
    return unsubs.length
      ? () => {
          forEach(unsubs, unsub => unsub());
        }
      : noop;
  };
}

function combineSagas(
  sagas: (Saga | [null | string, Saga])[],
  context: ModelContext
) {
  sagas = filter(
    map(sagas, effect => {
      let fn: Saga;
      if (isArray(effect)) {
        const [type, eff] = effect;
        const fork = wrapForkSaga(eff, context, type);
        fn =
          type != null
            ? function*() {
                while (true) {
                  yield fork(yield take(type));
                }
              }
            : function*() {
                yield fork({});
              };
        if (process.env.NODE_ENV !== "production") {
          Object.defineProperty(fn, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: `saga/daemon:${type || eff.name || uniqueId("service")}`
          });
        }
      } else {
        fn = effect;
      }
      return fn;
    }),
    saga => saga !== noeff
  );

  if (!sagas.length) {
    return noeff;
  }

  if (sagas.length === 1) {
    return sagas[0] as Saga;
  }

  return function* saga() {
    yield all(map(sagas as Saga[], saga => saga()));
  };
}

// API declaration
let bootstrap: typeof bootstrapApi;
let init: typeof initApi;
let hotReload: typeof hotReloadApi;
let model: typeof modelApi;

// API: bootstrap()
bootstrap = (factory, options = {}) => {
  const store = init(
    factory,
    pick(options, ["plugins", "strict", "services"])
  ) as EnhancedRootModel<any>;

  let unsub: () => void;
  let stopped = false;

  store.stop = () => {
    if (process.env.NODE_ENV !== "production") {
      if (stopped) {
        throw new Error(
          "[PANIC] Cannot invoke RootModel::stop() more than once."
        );
      }
    }
    stopped = true;
    if (unsub) {
      unsub();
    }

    store.io.channel.put(END);
  };

  store.hotReload = (nextFactory: any) => {
    store.stop();
    stopped = false;
    hotReload(store, nextFactory);
    runSaga(assign({}, store.io, options.saga), store.service);
    unsub = store.subscribe();
  };

  runSaga(assign({}, store.io, options.saga), store.saga);
  unsub = store.subscribe();

  return store;
};

// API: init()
init = (factory, options = {}) => {
  const { store: storeOptions, bind } = factory.configure();
  const store = new Store(
    assign(
      {
        plugins: options.plugins,
        strict: options.strict
      },
      storeOptions
    )
  );
  const channel = stdChannel();
  const model = bind({
    namespace: [],
    services: options.services!,
    state: store.state,
    store,
    channel
  }) as RootModel<ReturnType<typeof bind>>;
  model.store = store;
  model.io = createIO(store, channel);
  return model;
};

// API: hotReload()
hotReload = (model, factory, options = {}) => {
  const { store: storeOptions, bind } = factory.configure();
  const channel = stdChannel();

  model.store.hotUpdate(storeOptions);
  const nextModel = bind({
    namespace: [],
    services: options.services!,
    state: model.store.state,
    store: model.store,
    channel
  });

  model.actions = nextModel.actions;
  model.getters = nextModel.getters;
  model.saga = nextModel.saga;
  model.subscribe = nextModel.subscribe;
  model.dispatch = nextModel.dispatch;
  model.io = createIO(model.store, channel);
};

// API: model()
model = <typeof modelApi>(options => {
  let prefix = "";
  if (process.env.NODE_ENV != "production") {
    prefix = (options as any).__prefix;
  }
  const modules = options.modules;

  // name creator.
  const nameCreator = (category?: string) => (_: any, key: string) =>
    process.env.NODE_ENV !== "production"
      ? `${category || ""}${prefix}/${key}`
      : uniqueId();

  // Generate getter keys.
  const getters = (options.getters as any) as Record<string, Function>;
  const getterKeyMap = mapValues(getters, nameCreator());

  // Generate action action keys.
  const actionsActionKeyMap = mapValues(
    (options.actions || {}) as Record<string, Function>,
    nameCreator(process.env.NODE_ENV !== "production" ? "action/action:" : "")
  );

  // Generate mutation action keys.
  const mutations = options.mutations as Record<string, Function>;
  const mutationActionKeyMap = mapValues(
    mutations,
    nameCreator(process.env.NODE_ENV !== "production" ? "mutation:" : "")
  );

  // Generate mutation effects.
  const mutationEffectActionKeyMap = mapValues(
    mutations,
    nameCreator(process.env.NODE_ENV !== "production" ? "action/mutation:" : "")
  );

  // Generate effect action keys from effects and mutatons.
  const effects = (options.effects as any) as Record<string, Function>;
  const effectActionKeyMap = mapValues(
    effects,
    nameCreator(process.env.NODE_ENV !== "production" ? "action/effect:" : "")
  );

  // Resolve sagas.
  const sagas = [] as Saga[];

  forOwn(options.sagas, (fn: Saga) => {
    let wrapper = fn;
    if (process.env.NODE_ENV !== "production") {
      wrapper = function(this: any, ...args: any[]) {
        return fn.apply(this, args);
      };
      Object.defineProperty(wrapper, "name", {
        configurable: true,
        writable: false,
        enumerable: false,
        value: nameCreator()(null, fn.name || uniqueId("service"))
      });
    }
    sagas.push(wrapper);
  });

  // Check if actions conflict.
  if (process.env.NODE_ENV !== "production") {
    const conflicts = intersection(
      keys(actionsActionKeyMap),
      keys(mutationEffectActionKeyMap),
      keys(effectActionKeyMap),
      keys(modules)
    );
    assert(
      !conflicts.length,
      `[PANIC] name conflicts for effects, mutations and service actions under namespace "${prefix}":\n  ${conflicts}`
    );
  }

  // Create action creators.
  const actionCreators = merge(
    mapValues(
      merge(
        {},
        actionsActionKeyMap,
        mutationEffectActionKeyMap,
        effectActionKeyMap
      ),
      type => {
        const fn = (payload: any) => ({
          type,
          payload
        });
        Object.defineProperty(fn, "toString", {
          configurable: true,
          enumerable: false,
          writable: false,
          value: () => type
        });
        if (process.env.NODE_ENV !== "production") {
          Object.defineProperty(fn, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: `action:${type}`
          });
        }
        return fn;
      }
    ),
    mapValues(modules, module => module.actions_)
  );

  // Sucribe.
  const subs = [] as Function[];
  const subscribe = (sub: Function) => {
    subs.push(sub);
  };

  // Configure
  const configure = (() => {
    const context = {} as ModelContext;

    // Generate store getters.
    const storeGetters = mapKeys(
      mapValues(getterKeyMap, (key, name) =>
        wrapGetter(getters![name], context, key)
      ),
      (getter_, name) => getterKeyMap[name]
    );

    // Generate store mutations.
    const storeMutations = mapKeys(
      mapValues(mutationActionKeyMap, (key, name) =>
        wrapMutation(mutations![name], context, key)
      ),
      (mutation_, name) => mutationActionKeyMap[name]
    );

    // Generate store actions from effects.
    const storeActions = createEffectsStoreActions(
      effects,
      effectActionKeyMap,
      context
    );

    // Generate store actions from mutation effects.
    merge(
      storeActions,
      createMutationsStoreActions(
        mutationEffectActionKeyMap,
        mutationActionKeyMap,
        context
      ),
      createActionsStoreActions(actionsActionKeyMap, context)
    );

    // Generate store modules.
    const moduleConfigs = mapValues(modules, module => module.configure());
    const storeModules = mapValues(moduleConfigs, ({ store }) => store);

    const data = options.data;

    return {
      // The config for store.
      store: {
        state: options.state,
        getters: storeGetters,
        mutations: storeMutations,
        actions: storeActions,
        modules: storeModules
      } as any,
      bind({ namespace, store, state, channel, services }) {
        context.c = channel;

        // Bind modules.
        const modelModules = mapValues(moduleConfigs, ({ bind }, key) =>
          bind({
            namespace: [...namespace, key],
            store,
            state: state[key],
            channel,
            services
          })
        );

        // Create model getters.
        const modelGetters = reduce(
          getterKeyMap,
          (getters, key, name) => {
            const descriptor = Object.getOwnPropertyDescriptor(
              store.getters,
              key
            );

            if (process.env.NODE_ENV !== "production") {
              assert(
                descriptor,
                `[PANIC] Failed to get property "${key}" from store.`
              );
            }

            Object.defineProperty(getters, name, descriptor!);
            return getters;
          },
          mapValues(modelModules, model => model.getters)
        );

        // Create model dispatcher.
        const dispatch = createModelDispatcher(prefix, store);

        // Attach mutation effect actions.
        forOwn(mutationEffectActionKeyMap, (key, name) => {
          (dispatch as any)[name] = createActionDispatcher(store, key);
        });

        // Attach effect actions.
        forOwn(effectActionKeyMap, (key, name) => {
          (dispatch as any)[name] = createActionDispatcher(store, key);
        });

        // Attach module actions.
        forOwn(modelModules, (model, name) => {
          (dispatch as any)[name] = model.dispatch;
        });

        // Create model sub list, modules' first.
        const modelSubscription = combineSubscriptions(
          concat(
            map(modelModules, model => model.subscribe),
            map(subs, sub => () => sub(context.m))
          )
        );

        // Create model service.
        const modelService = combineSagas(
          concat(
            map(modelModules, model => model.saga) as any,
            createModelSagas(sagas, effects, effectActionKeyMap) as any
          ),
          context
        );

        return (context.m = {
          namespace,

          services,

          // for sub context.
          onStoreCommit(fn: any) {
            return store.subscribe(fn);
          },

          onStoreDispatch(fn: any) {
            return store.subscribeAction(fn);
          },

          watch(getter: any, cb: any, options: any) {
            return store.watch(getter, cb, options);
          },

          // model state.
          state: state,

          // model dispatch.
          dispatch: dispatch as any,

          // model data.
          data: isFunction(data) ? data() : data || {},

          // model actions.
          actions: actionCreators,

          // model getters.
          getters: modelGetters,

          // model service.
          saga: modelService,

          // model subscription.
          subscribe: modelSubscription
        } as Model);
      }
    };
  }) as ReturnType<typeof modelApi>["configure"];

  // Config object
  const config = {
    actions_: actionCreators,
    configure: configure,
    subscribe(sub: Function) {
      subscribe(sub);
      return config;
    }
  } as ReturnType<typeof modelApi>;

  return config;
});

export { bootstrap, init, hotReload, model };
