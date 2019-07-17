"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = require("lodash");
var action_1 = require("./action");
var context_1 = require("./context");
/**
 * Create an actiton dispatcher with a mutation to trigger.
 */
function mutation(mutation) {
    var context = context_1.getContext();
    var type = lodash_1.uniqueId((mutation.name || 'm') + "#");
    var runtime = context.runtime;
    context.mutations[type] = function onMutationCommit(_, payload) {
        return mutation(payload);
    };
    return action_1.action(function commitMutation(payload) {
        runtime.store.commit(type, payload);
    });
}
exports.mutation = mutation;
