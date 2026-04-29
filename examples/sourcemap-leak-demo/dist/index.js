"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgent = void 0;
/**
 * Public API — this is the only part users are supposed to see.
 * The internal agent orchestration, prompt templates, and tool routing
 * logic should remain proprietary.
 */
var orchestrator_1 = require("./agent/orchestrator");
Object.defineProperty(exports, "createAgent", { enumerable: true, get: function () { return orchestrator_1.createAgent; } });
//# sourceMappingURL=index.js.map