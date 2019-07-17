"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = require("lodash");
var context_1 = require("./context");
var utils_1 = require("./utils");
function action(cb, creator) {
    var context = context_1.getContext();
    var type = lodash_1.uniqueId(((creator && creator.name) || cb.name || 'a') + "#");
    var runtime = context.runtime;
    if (!creator) {
        creator = utils_1.identity;
    }
    var action = function createAction() {
        return {
            type: type,
            payload: Reflect.apply(creator, null, arguments),
        };
    };
    action.type = type;
    action.toString = function () { return type; };
    var dispatch = function dispatchAction() {
        return runtime.store.dispatch({
            type: type,
            payload: Reflect.apply(creator, null, arguments),
        });
    };
    dispatch.action = action;
    context.actions[type] = function onActionDispatch(store_, action) {
        var res = cb(action.payload);
        if (res && lodash_1.isFunction(res.then)) {
            return res.then(function (resolved) {
                runtime.chan.put(action);
                return resolved;
            });
        }
        runtime.chan.put(action);
        return res;
    };
    return dispatch;
}
exports.action = action;
