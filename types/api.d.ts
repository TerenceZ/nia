import {
  ModelFactory,
  Model,
  RootModel,
  CombineState,
  CombineGetters,
  CombineActionCreators
} from "./model";
import { ModelOptions, StoreExtraOptions, Services, SERVICES } from "./options";
import { RunSagaOptions } from "redux-saga";

export interface ServicesOptions {
  services?: Omit<Services, typeof SERVICES>;
}

export interface BootstrapOptions
  extends StoreExtraOptions<any>,
    ServicesOptions {
  saga?: RunSagaOptions<any, any>;
}

export type EnhancedRootModel<M extends Model> = RootModel<M> & {
  hotReload(factory: ModelFactory<M>): void;
};

export declare function bootstrap<M extends Model, D, S>(
  factory: ModelFactory<M, D, S>,
  options?: BootstrapOptions
): EnhancedRootModel<M>;

export declare function init<M extends Model, D, S>(
  factory: ModelFactory<M, D, S>,
  options?: StoreExtraOptions<S> & ServicesOptions
): RootModel<M>;

export declare function hotReload<M extends RootModel>(
  root: M,
  factory: ModelFactory<M>,
  options?: ServicesOptions
): void;

export declare function model<
  Data,
  State,
  Actions,
  Mutations,
  Modules,
  GettersDef,
  EffectsDef,
  Sagasdef
>(
  options: ModelOptions<
    Data,
    State,
    Actions,
    Mutations,
    Modules,
    GettersDef,
    EffectsDef,
    Sagasdef
  >
): ModelFactory<
  Model<
    CombineState<State, Modules>,
    CombineGetters<GettersDef, Modules>,
    CombineActionCreators<Actions, Mutations, Modules, EffectsDef>
  >,
  Data
>;
