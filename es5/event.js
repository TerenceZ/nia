"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var action_1 = require("./action");
var utils_1 = require("./utils");
function event(payloadCreator) {
    return action_1.action(utils_1.noop, payloadCreator);
}
exports.event = event;
