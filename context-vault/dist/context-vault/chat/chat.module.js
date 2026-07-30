"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const chat_controller_1 = require("./chat.controller");
const chat_service_1 = require("./chat.service");
const chat_repository_1 = require("./chat.repository");
const epoch_module_1 = require("../epoch/epoch.module");
const message_store_module_1 = require("../message-store/message-store.module");
const token_budget_module_1 = require("../token-budget/token-budget.module");
const context_router_module_1 = require("../context-router/context-router.module");
const active_context_module_1 = require("../active-context/active-context.module");
const memory_module_1 = require("../memory/memory.module");
const capsule_module_1 = require("../capsule/capsule.module");
const indexing_module_1 = require("../indexing/indexing.module");
const embeddings_module_1 = require("../embeddings/embeddings.module");
const observability_module_1 = require("../observability/observability.module");
const tokenizer_module_1 = require("../shared/tokenizer/tokenizer.module");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            epoch_module_1.EpochModule,
            message_store_module_1.MessageStoreModule,
            token_budget_module_1.TokenBudgetModule,
            context_router_module_1.ContextRouterModule,
            active_context_module_1.ActiveContextModule,
            memory_module_1.MemoryModule,
            capsule_module_1.CapsuleModule,
            indexing_module_1.IndexingModule,
            embeddings_module_1.EmbeddingsModule,
            observability_module_1.ObservabilityModule,
            tokenizer_module_1.TokenizerModule,
        ],
        controllers: [chat_controller_1.ChatController],
        providers: [chat_service_1.ChatService, chat_repository_1.ChatRepository],
        exports: [chat_service_1.ChatService, chat_repository_1.ChatRepository],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map