"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SemanticRetrieverService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticRetrieverService = void 0;
const common_1 = require("@nestjs/common");
const embeddings_service_1 = require("../embeddings/embeddings.service");
const indexing_service_1 = require("../indexing/indexing.service");
const message_repository_1 = require("../message-store/message.repository");
let SemanticRetrieverService = SemanticRetrieverService_1 = class SemanticRetrieverService {
    constructor(embeddingsService, indexingService, messageRepo) {
        this.embeddingsService = embeddingsService;
        this.indexingService = indexingService;
        this.messageRepo = messageRepo;
        this.logger = new common_1.Logger(SemanticRetrieverService_1.name);
    }
    async searchMessages(query, chatId, k) {
        try {
            const embedding = await this.embeddingsService.embed(query);
            if (!embedding.length)
                return [];
            const results = this.indexingService.searchMessages(embedding, k * 2);
            if (!results.length)
                return [];
            const ids = results.map(r => r.id);
            const messages = this.messageRepo.getByIds(ids);
            const chatMessages = messages.filter(m => m.chat_id === chatId);
            return chatMessages.slice(0, k).map(msg => {
                const result = results.find(r => r.id === msg.id);
                return {
                    id: msg.id,
                    score: result?.score ?? 0,
                    content_preview: msg.content.slice(0, 200),
                    source_type: 'message',
                };
            });
        }
        catch (err) {
            this.logger.warn(`Semantic search failed: ${err.message}`);
            return [];
        }
    }
    async searchCapsules(query, chatId, k) {
        try {
            const embedding = await this.embeddingsService.embed(query);
            if (!embedding.length)
                return [];
            const results = this.indexingService.searchCapsules(embedding, k);
            return results.map(r => ({
                id: r.id,
                score: r.score,
                content_preview: '',
                source_type: 'capsule',
            }));
        }
        catch (err) {
            this.logger.warn(`Capsule semantic search failed: ${err.message}`);
            return [];
        }
    }
};
exports.SemanticRetrieverService = SemanticRetrieverService;
exports.SemanticRetrieverService = SemanticRetrieverService = SemanticRetrieverService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [embeddings_service_1.EmbeddingsService,
        indexing_service_1.IndexingService,
        message_repository_1.MessageRepository])
], SemanticRetrieverService);
//# sourceMappingURL=semantic-retriever.service.js.map