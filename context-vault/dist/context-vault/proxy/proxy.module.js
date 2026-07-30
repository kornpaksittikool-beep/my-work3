"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyModule = void 0;
const common_1 = require("@nestjs/common");
const proxy_controller_1 = require("./proxy.controller");
const llama_proxy_service_1 = require("./llama-proxy.service");
const chat_completions_interceptor_service_1 = require("./chat-completions-interceptor.service");
const active_context_module_1 = require("../active-context/active-context.module");
const context_router_module_1 = require("../context-router/context-router.module");
const message_store_module_1 = require("../message-store/message-store.module");
const epoch_module_1 = require("../epoch/epoch.module");
const token_budget_module_1 = require("../token-budget/token-budget.module");
const embeddings_module_1 = require("../embeddings/embeddings.module");
const indexing_module_1 = require("../indexing/indexing.module");
const memory_module_1 = require("../memory/memory.module");
const capsule_module_1 = require("../capsule/capsule.module");
const chat_module_1 = require("../chat/chat.module");
const tokenizer_module_1 = require("../shared/tokenizer/tokenizer.module");
let ProxyModule = class ProxyModule {
};
exports.ProxyModule = ProxyModule;
exports.ProxyModule = ProxyModule = __decorate([
    (0, common_1.Module)({
        imports: [
            chat_module_1.ChatModule,
            active_context_module_1.ActiveContextModule,
            context_router_module_1.ContextRouterModule,
            message_store_module_1.MessageStoreModule,
            epoch_module_1.EpochModule,
            token_budget_module_1.TokenBudgetModule,
            embeddings_module_1.EmbeddingsModule,
            indexing_module_1.IndexingModule,
            memory_module_1.MemoryModule,
            capsule_module_1.CapsuleModule,
            tokenizer_module_1.TokenizerModule,
        ],
        controllers: [proxy_controller_1.ProxyController],
        providers: [llama_proxy_service_1.LlamaProxyService, chat_completions_interceptor_service_1.ChatCompletionsInterceptorService],
    })
], ProxyModule);
//# sourceMappingURL=proxy.module.js.map