"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextVaultModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("./shared/database/database.module");
const config_module_1 = require("./shared/config/config.module");
const tokenizer_module_1 = require("./shared/tokenizer/tokenizer.module");
const chat_module_1 = require("./chat/chat.module");
const message_store_module_1 = require("./message-store/message-store.module");
const epoch_module_1 = require("./epoch/epoch.module");
const token_budget_module_1 = require("./token-budget/token-budget.module");
const embeddings_module_1 = require("./embeddings/embeddings.module");
const indexing_module_1 = require("./indexing/indexing.module");
const retrieval_module_1 = require("./retrieval/retrieval.module");
const context_router_module_1 = require("./context-router/context-router.module");
const active_context_module_1 = require("./active-context/active-context.module");
const memory_module_1 = require("./memory/memory.module");
const capsule_module_1 = require("./capsule/capsule.module");
const observability_module_1 = require("./observability/observability.module");
const proxy_module_1 = require("./proxy/proxy.module");
const index_controller_1 = require("./indexing/index.controller");
let ContextVaultModule = class ContextVaultModule {
};
exports.ContextVaultModule = ContextVaultModule;
exports.ContextVaultModule = ContextVaultModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.AppConfigModule,
            database_module_1.DatabaseModule,
            tokenizer_module_1.TokenizerModule,
            epoch_module_1.EpochModule,
            message_store_module_1.MessageStoreModule,
            token_budget_module_1.TokenBudgetModule,
            embeddings_module_1.EmbeddingsModule,
            indexing_module_1.IndexingModule,
            retrieval_module_1.RetrievalModule,
            context_router_module_1.ContextRouterModule,
            active_context_module_1.ActiveContextModule,
            memory_module_1.MemoryModule,
            capsule_module_1.CapsuleModule,
            observability_module_1.ObservabilityModule,
            chat_module_1.ChatModule,
            proxy_module_1.ProxyModule,
        ],
        controllers: [index_controller_1.IndexController],
    })
], ContextVaultModule);
//# sourceMappingURL=context-vault.module.js.map