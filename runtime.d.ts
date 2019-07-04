import { init as initApi, hotReload as hotReloadApi, model as modelApi, bootstrap as bootstrapApi } from "../types/api";
declare let bootstrap: typeof bootstrapApi;
declare let init: typeof initApi;
declare let hotReload: typeof hotReloadApi;
declare let model: typeof modelApi;
export { bootstrap, init, hotReload, model };
