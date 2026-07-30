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
var CapsuleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapsuleService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const capsule_repository_1 = require("./capsule.repository");
const message_repository_1 = require("../message-store/message.repository");
const memory_repository_1 = require("../memory/memory.repository");
const indexing_service_1 = require("../indexing/indexing.service");
const embeddings_service_1 = require("../embeddings/embeddings.service");
const tokenizer_service_1 = require("../shared/tokenizer/tokenizer.service");
const types_1 = require("../shared/types");
let CapsuleService = CapsuleService_1 = class CapsuleService {
    constructor(capsuleRepo, messageRepo, memoryRepo, indexingService, embeddingsService, tokenizerService, configService) {
        this.capsuleRepo = capsuleRepo;
        this.messageRepo = messageRepo;
        this.memoryRepo = memoryRepo;
        this.indexingService = indexingService;
        this.embeddingsService = embeddingsService;
        this.tokenizerService = tokenizerService;
        this.configService = configService;
        this.logger = new common_1.Logger(CapsuleService_1.name);
        this.llamaServerUrl = this.configService.get('contextVault.llamaServerUrl', 'http://localhost:8080');
    }
    async buildCapsule(chatId, epochId, type) {
        try {
            const messages = this.messageRepo.getByEpochId(epochId);
            if (!messages.length) {
                return this.capsuleRepo.create({
                    chatId,
                    epochId,
                    type,
                    summary: '(empty epoch)',
                    openTasks: [],
                    constraints: [],
                    sourceMessageIds: [],
                });
            }
            const conversationText = messages
                .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
                .join('\n\n');
            const summary = await this.summarize(conversationText);
            const openTasks = this.memoryRepo
                .getByChatId(chatId, types_1.MemoryType.TASK, types_1.MemoryStatus.ACTIVE)
                .filter(m => m.task_status !== 'DONE')
                .map(m => m.content);
            const ruleMemories = this.memoryRepo.getByChatId(chatId, types_1.MemoryType.RULE, types_1.MemoryStatus.ACTIVE);
            const decisionMemories = this.memoryRepo.getByChatId(chatId, types_1.MemoryType.DECISION, types_1.MemoryStatus.ACTIVE);
            const constraints = [...ruleMemories, ...decisionMemories].map(m => m.content);
            const sourceMessageIds = messages.map(m => m.id);
            const tokenStart = messages[0].token_start ?? 0;
            const tokenEnd = messages[messages.length - 1].token_end ?? 0;
            const tokenCount = await this.tokenizerService.countTokens(summary);
            const capsule = this.capsuleRepo.create({
                chatId,
                epochId,
                type,
                summary,
                openTasks,
                constraints,
                sourceMessageIds,
                tokenStart,
                tokenEnd,
                tokenCount,
            });
            const embedding = await this.embeddingsService.embed(summary);
            if (embedding.length) {
                this.indexingService.addCapsule(capsule.id, embedding);
                this.capsuleRepo.updateEmbeddingId(capsule.id, capsule.id);
                this.indexingService.saveIndexes();
            }
            this.logger.log(`Built ${type} capsule ${capsule.id} for chat ${chatId}`);
            return capsule;
        }
        catch (err) {
            this.logger.error(`Failed to build capsule: ${err.message}`);
            throw err;
        }
    }
    async summarize(text) {
        try {
            const prompt = `Summarize the following conversation concisely, preserving key decisions, facts, tasks, and constraints. Be brief but complete.\n\n${text.slice(0, 8000)}\n\nSummary:`;
            const response = await fetch(`${this.llamaServerUrl}/completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    max_tokens: 512,
                    stream: false,
                    temperature: 0.1,
                }),
                signal: AbortSignal.timeout(30000),
            });
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.content ?? data.choices?.[0]?.text ?? this.simpleSummary(text);
        }
        catch (err) {
            this.logger.warn(`Summarization via llama.cpp failed: ${err.message}, using fallback`);
            return this.simpleSummary(text);
        }
    }
    simpleSummary(text) {
        const lines = text.split('\n').filter(l => l.trim());
        const preview = lines.slice(0, 5).join(' ').slice(0, 500);
        return `[Summary: ${lines.length} messages] ${preview}...`;
    }
    async getLatestCapsule(chatId) {
        return this.capsuleRepo.getLatestByChatId(chatId);
    }
    async getCapsulesByChat(chatId) {
        return this.capsuleRepo.getByChatId(chatId);
    }
    async shouldBuildCapsule(chatId, currentTokens) {
        const chunkInterval = this.configService.get('contextVault.chunkIntervalTokens', 12000);
        const topicInterval = this.configService.get('contextVault.topicIntervalTokens', 48000);
        const sessionInterval = this.configService.get('contextVault.sessionIntervalTokens', 150000);
        const capsules = this.capsuleRepo.getByChatId(chatId);
        const lastTokenEnd = capsules.length > 0 ? (capsules[capsules.length - 1].token_end ?? 0) : 0;
        const tokensSinceLast = currentTokens - lastTokenEnd;
        if (tokensSinceLast >= sessionInterval)
            return types_1.CapsuleType.SESSION;
        if (tokensSinceLast >= topicInterval)
            return types_1.CapsuleType.TOPIC;
        if (tokensSinceLast >= chunkInterval)
            return types_1.CapsuleType.CHUNK;
        return null;
    }
};
exports.CapsuleService = CapsuleService;
exports.CapsuleService = CapsuleService = CapsuleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [capsule_repository_1.CapsuleRepository,
        message_repository_1.MessageRepository,
        memory_repository_1.MemoryRepository,
        indexing_service_1.IndexingService,
        embeddings_service_1.EmbeddingsService,
        tokenizer_service_1.TokenizerService,
        config_1.ConfigService])
], CapsuleService);
//# sourceMappingURL=capsule.service.js.map