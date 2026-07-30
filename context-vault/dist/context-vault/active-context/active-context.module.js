"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveContextModule = void 0;
const common_1 = require("@nestjs/common");
const active_context_builder_service_1 = require("./active-context-builder.service");
const retrieval_module_1 = require("../retrieval/retrieval.module");
const token_budget_module_1 = require("../token-budget/token-budget.module");
const tokenizer_module_1 = require("../shared/tokenizer/tokenizer.module");
const message_store_module_1 = require("../message-store/message-store.module");
const capsule_repository_1 = require("../capsule/capsule.repository");
let ActiveContextModule = class ActiveContextModule {
};
exports.ActiveContextModule = ActiveContextModule;
exports.ActiveContextModule = ActiveContextModule = __decorate([
    (0, common_1.Module)({
        imports: [retrieval_module_1.RetrievalModule, token_budget_module_1.TokenBudgetModule, tokenizer_module_1.TokenizerModule, message_store_module_1.MessageStoreModule],
        providers: [active_context_builder_service_1.ActiveContextBuilderService, capsule_repository_1.CapsuleRepository],
        exports: [active_context_builder_service_1.ActiveContextBuilderService],
    })
], ActiveContextModule);
//# sourceMappingURL=active-context.module.js.map