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
var RerankerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RerankerService = void 0;
const common_1 = require("@nestjs/common");
const tokenizer_service_1 = require("../shared/tokenizer/tokenizer.service");
const message_repository_1 = require("../message-store/message.repository");
const memory_repository_1 = require("../memory/memory.repository");
let RerankerService = RerankerService_1 = class RerankerService {
    constructor(tokenizerService, messageRepo, memoryRepo) {
        this.tokenizerService = tokenizerService;
        this.messageRepo = messageRepo;
        this.memoryRepo = memoryRepo;
        this.logger = new common_1.Logger(RerankerService_1.name);
    }
    async rerank(inputs, chatId, topK, maxTokens, currentProject) {
        try {
            const scoreMap = new Map();
            for (const input of inputs) {
                for (const c of input.candidates) {
                    const existing = scoreMap.get(c.id) ?? {
                        id: c.id,
                        content_preview: c.content_preview,
                        source_type: c.source_type,
                        semantic_score: 0,
                        keyword_score: 0,
                        recency_score: 0,
                        importance_score: 0.5,
                        source_confidence: 0.5,
                        project_match: 0,
                        content: '',
                    };
                    if (input.type === 'semantic')
                        existing.semantic_score = Math.max(existing.semantic_score ?? 0, c.score);
                    if (input.type === 'keyword')
                        existing.keyword_score = Math.max(existing.keyword_score ?? 0, c.score);
                    if (input.type === 'structured') {
                        existing.source_confidence = c.score;
                        existing.importance_score = c.score;
                    }
                    if (input.type === 'capsule')
                        existing.semantic_score = Math.max(existing.semantic_score ?? 0, c.score);
                    scoreMap.set(c.id, existing);
                }
            }
            const now = Date.now();
            const allIds = Array.from(scoreMap.keys());
            const messageRows = this.messageRepo.getByIds(allIds);
            const memoryRows = this.memoryRepo.getByIds(allIds);
            for (const msg of messageRows) {
                const entry = scoreMap.get(msg.id);
                if (!entry)
                    continue;
                entry.content = msg.content;
                entry.importance_score = msg.importance ?? 0.5;
                const msgTime = new Date(msg.created_at).getTime();
                entry.recency_score = Math.max(0, 1 - (now - msgTime) / (1000 * 60 * 60 * 24 * 30));
                entry.source_confidence = 0.7;
            }
            for (const mem of memoryRows) {
                const entry = scoreMap.get(mem.id);
                if (!entry)
                    continue;
                entry.content = mem.content;
                entry.source_confidence = mem.confidence;
                entry.importance_score = mem.confidence;
                if (currentProject && mem.project === currentProject)
                    entry.project_match = 1;
            }
            const scored = [];
            for (const [id, e] of scoreMap) {
                const s = e.semantic_score ?? 0;
                const k = e.keyword_score ?? 0;
                const r = e.recency_score ?? 0;
                const i = e.importance_score ?? 0.5;
                const c = e.source_confidence ?? 0.5;
                const p = e.project_match ?? 0;
                const finalScore = s * 0.35 + k * 0.25 + r * 0.10 + i * 0.15 + c * 0.10 + p * 0.05;
                scored.push({
                    id,
                    score: finalScore,
                    final_score: finalScore,
                    semantic_score: s,
                    keyword_score: k,
                    recency_score: r,
                    importance_score: i,
                    source_confidence: c,
                    project_match: p,
                    content: e.content ?? e.content_preview ?? '',
                    content_preview: e.content_preview ?? '',
                    source_type: e.source_type,
                });
            }
            scored.sort((a, b) => b.final_score - a.final_score);
            const selected = [];
            let tokenTotal = 0;
            for (const candidate of scored.slice(0, topK)) {
                if (!candidate.content)
                    continue;
                const tokens = await this.tokenizerService.countTokens(candidate.content);
                if (tokenTotal + tokens > maxTokens)
                    break;
                candidate.token_count = tokens;
                selected.push(candidate);
                tokenTotal += tokens;
            }
            return selected;
        }
        catch (err) {
            this.logger.error(`Reranking failed: ${err.message}`);
            return [];
        }
    }
};
exports.RerankerService = RerankerService;
exports.RerankerService = RerankerService = RerankerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tokenizer_service_1.TokenizerService,
        message_repository_1.MessageRepository,
        memory_repository_1.MemoryRepository])
], RerankerService);
//# sourceMappingURL=reranker.service.js.map