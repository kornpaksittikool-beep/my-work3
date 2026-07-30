"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetrievalModule = void 0;
const common_1 = require("@nestjs/common");
const keyword_retriever_service_1 = require("./keyword-retriever.service");
const semantic_retriever_service_1 = require("./semantic-retriever.service");
const structured_memory_retriever_service_1 = require("./structured-memory-retriever.service");
const reranker_service_1 = require("./reranker.service");
const embeddings_module_1 = require("../embeddings/embeddings.module");
const indexing_module_1 = require("../indexing/indexing.module");
const message_store_module_1 = require("../message-store/message-store.module");
const tokenizer_module_1 = require("../shared/tokenizer/tokenizer.module");
const memory_repository_1 = require("../memory/memory.repository");
let RetrievalModule = class RetrievalModule {
};
exports.RetrievalModule = RetrievalModule;
exports.RetrievalModule = RetrievalModule = __decorate([
    (0, common_1.Module)({
        imports: [embeddings_module_1.EmbeddingsModule, indexing_module_1.IndexingModule, message_store_module_1.MessageStoreModule, tokenizer_module_1.TokenizerModule],
        providers: [
            keyword_retriever_service_1.KeywordRetrieverService,
            semantic_retriever_service_1.SemanticRetrieverService,
            structured_memory_retriever_service_1.StructuredMemoryRetrieverService,
            reranker_service_1.RerankerService,
            memory_repository_1.MemoryRepository,
        ],
        exports: [
            keyword_retriever_service_1.KeywordRetrieverService,
            semantic_retriever_service_1.SemanticRetrieverService,
            structured_memory_retriever_service_1.StructuredMemoryRetrieverService,
            reranker_service_1.RerankerService,
        ],
    })
], RetrievalModule);
//# sourceMappingURL=retrieval.module.js.map