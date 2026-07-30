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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const message_store_service_1 = require("../message-store/message-store.service");
const epoch_service_1 = require("../epoch/epoch.service");
const token_budget_service_1 = require("../token-budget/token-budget.service");
const context_router_service_1 = require("../context-router/context-router.service");
const active_context_builder_service_1 = require("../active-context/active-context-builder.service");
const memory_service_1 = require("../memory/memory.service");
const memory_extractor_service_1 = require("../memory/memory-extractor.service");
const capsule_service_1 = require("../capsule/capsule.service");
const indexing_service_1 = require("../indexing/indexing.service");
const embeddings_service_1 = require("../embeddings/embeddings.service");
const observability_service_1 = require("../observability/observability.service");
const tokenizer_service_1 = require("../shared/tokenizer/tokenizer.service");
const chat_repository_1 = require("./chat.repository");
const types_1 = require("../shared/types");
const config_1 = require("@nestjs/config");
let ChatController = ChatController_1 = class ChatController {
    constructor(chatService, chatRepo, messageStore, epochService, tokenBudget, contextRouter, contextBuilder, memoryService, memoryExtractor, capsuleService, indexingService, embeddingsService, observability, tokenizerService, configService) {
        this.chatService = chatService;
        this.chatRepo = chatRepo;
        this.messageStore = messageStore;
        this.epochService = epochService;
        this.tokenBudget = tokenBudget;
        this.contextRouter = contextRouter;
        this.contextBuilder = contextBuilder;
        this.memoryService = memoryService;
        this.memoryExtractor = memoryExtractor;
        this.capsuleService = capsuleService;
        this.indexingService = indexingService;
        this.embeddingsService = embeddingsService;
        this.observability = observability;
        this.tokenizerService = tokenizerService;
        this.configService = configService;
        this.logger = new common_1.Logger(ChatController_1.name);
        this.chatTurnQueues = new Map();
    }
    async createModelProfile(dto) {
        return this.chatService.createModelProfile(dto);
    }
    async listModelProfiles() {
        return this.chatService.listModelProfiles();
    }
    async getModelProfile(id) {
        return this.chatService.getModelProfile(id);
    }
    async createChat(dto) {
        this.validateCreateChatDto(dto);
        return this.chatService.createChat(dto);
    }
    async listChats() {
        return this.chatService.listChats();
    }
    async getChat(id) {
        const chat = await this.chatService.getChat(id);
        const activeEpoch = chat.active_epoch_id
            ? await this.epochService.getEpochById(chat.active_epoch_id)
            : null;
        return { ...chat, activeEpoch };
    }
    async getChatMessages(chatId) {
        await this.chatService.getChatOrThrow(chatId);
        return this.messageStore.getByChat(chatId);
    }
    async getChatEpochs(chatId) {
        await this.chatService.getChatOrThrow(chatId);
        return this.epochService.listEpochs(chatId);
    }
    async getChatCapsules(chatId) {
        await this.chatService.getChatOrThrow(chatId);
        const capsules = await this.capsuleService.getCapsulesByChat(chatId);
        return capsules.map(capsule => ({
            ...capsule,
            open_tasks: this.parseJsonArray(capsule.open_tasks),
            constraints: this.parseJsonArray(capsule.constraints),
            source_message_ids: this.parseJsonArray(capsule.source_message_ids),
        }));
    }
    async sendMessage(chatId, dto, res) {
        const llamaServerUrl = this.configService.get('contextVault.llamaServerUrl', 'http://localhost:8080');
        if (!this.chatRepo.getChatById(chatId)) {
            throw new common_1.NotFoundException(`Chat ${chatId} not found`);
        }
        const content = this.validateSendMessageDto(dto);
        const role = dto.role || types_1.MessageRole.USER;
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        const send = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };
        await this.enqueueChatTurn(chatId, async () => {
            try {
                const chat = this.chatRepo.getChatById(chatId);
                if (!chat) {
                    send({ type: 'error', message: `Chat ${chatId} not found` });
                    res.end();
                    return;
                }
                let epoch = await this.epochService.getActiveEpoch(chatId);
                if (!epoch) {
                    epoch = await this.epochService.createEpoch(chatId, chat.total_tokens);
                    this.chatRepo.updateChatActiveEpoch(chatId, epoch.id);
                }
                const userMsg = await this.messageStore.saveMessage({
                    chatId,
                    epochId: epoch.id,
                    role,
                    content,
                });
                const userTokenCount = await this.tokenizerService.countTokens(content);
                if (this.tokenBudget.shouldRollover(chat.total_tokens)) {
                    this.logger.log(`Triggering rollover for chat ${chatId}`);
                    await this.executeRollover(chatId, epoch.id, chat.total_tokens);
                    epoch = await this.epochService.getActiveEpoch(chatId);
                    if (!epoch) {
                        epoch = await this.epochService.createEpoch(chatId, chat.total_tokens);
                        this.chatRepo.updateChatActiveEpoch(chatId, epoch.id);
                    }
                }
                const plan = this.contextRouter.analyzeQuery(chatId, content);
                const startRetrieve = Date.now();
                const activeContext = await this.contextBuilder.build(plan, chatId, chat.total_tokens, content);
                const retrieveLatency = Date.now() - startRetrieve;
                send({
                    type: 'context',
                    tokenCount: activeContext.totalTokens,
                    sources: activeContext.sourceIds,
                });
                const prompt = this.contextBuilder.buildPromptString(activeContext, content);
                let assistantContent = '';
                let streamError = null;
                try {
                    const response = await fetch(`${llamaServerUrl}/completion`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt,
                            max_tokens: this.configService.get('contextVault.reservedOutputTokens', 6144),
                            stream: true,
                            temperature: 0.7,
                            stop: ['[USER]:', '[INST]'],
                        }),
                        signal: AbortSignal.timeout(120000),
                    });
                    if (!response.ok || !response.body) {
                        throw new Error(`llama.cpp returned HTTP ${response.status}`);
                    }
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
                        for (const line of lines) {
                            const jsonStr = line.slice(6).trim();
                            if (jsonStr === '[DONE]')
                                break;
                            try {
                                const parsed = JSON.parse(jsonStr);
                                const token = parsed.content ?? parsed.choices?.[0]?.text ?? '';
                                if (token) {
                                    assistantContent += token;
                                    send({ type: 'token', content: token });
                                }
                                if (parsed.stop || parsed.choices?.[0]?.finish_reason === 'stop')
                                    break;
                            }
                            catch (_parseErr) {
                            }
                        }
                    }
                }
                catch (err) {
                    streamError = err.message;
                }
                const assistantTokenCount = assistantContent
                    ? await this.tokenizerService.countTokens(assistantContent)
                    : 0;
                const assistantMsg = await this.messageStore.saveMessage({
                    chatId,
                    epochId: epoch.id,
                    role: types_1.MessageRole.ASSISTANT,
                    content: assistantContent,
                });
                const totalTokenCount = userTokenCount + assistantTokenCount;
                await this.messageStore.markCompleted(userMsg.id, chat.total_tokens, chat.total_tokens + userTokenCount, userTokenCount);
                if (streamError) {
                    await this.messageStore.markFailed(assistantMsg.id, chat.total_tokens + userTokenCount, chat.total_tokens + userTokenCount, 0);
                    this.chatRepo.incrementChatTokens(chatId, userTokenCount);
                    send({ type: 'error', message: streamError });
                    res.end();
                    return;
                }
                await this.messageStore.markCompleted(assistantMsg.id, chat.total_tokens + userTokenCount, chat.total_tokens + totalTokenCount, assistantTokenCount);
                this.chatRepo.incrementChatTokens(chatId, totalTokenCount);
                send({ type: 'done', messageId: assistantMsg.id, tokensUsed: totalTokenCount });
                res.end();
                const updatedChat = this.chatRepo.getChatById(chatId);
                Promise.resolve().then(async () => {
                    try {
                        const userEmbedding = await this.embeddingsService.embed(content);
                        if (userEmbedding.length) {
                            this.indexingService.addMessage(userMsg.id, userEmbedding);
                            await this.messageStore.setEmbeddingId(userMsg.id, userMsg.id);
                        }
                        const assistantEmbedding = await this.embeddingsService.embed(assistantContent);
                        if (assistantEmbedding.length) {
                            this.indexingService.addMessage(assistantMsg.id, assistantEmbedding);
                            await this.messageStore.setEmbeddingId(assistantMsg.id, assistantMsg.id);
                            this.indexingService.saveIndexes();
                        }
                        const userMsgRow = await this.messageStore.getById(userMsg.id);
                        const assistantMsgRow = await this.messageStore.getById(assistantMsg.id);
                        if (userMsgRow)
                            await this.memoryExtractor.extractFromMessage(chatId, userMsgRow);
                        if (assistantMsgRow)
                            await this.memoryExtractor.extractFromMessage(chatId, assistantMsgRow);
                        if (updatedChat && epoch) {
                            const capsuleType = await this.capsuleService.shouldBuildCapsule(chatId, updatedChat.total_tokens);
                            if (capsuleType) {
                                await this.capsuleService.buildCapsule(chatId, epoch.id, capsuleType);
                            }
                        }
                        await this.observability.saveRetrievalEvent({
                            chatId,
                            messageId: userMsg.id,
                            query: content,
                            retrievalType: types_1.RetrievalType.SEMANTIC,
                            candidates: activeContext.retrievalCandidates ?? [],
                            selected: activeContext.selectedItems ?? [],
                            totalTokensRetrieved: activeContext.totalTokens,
                            latencyMs: retrieveLatency,
                        });
                    }
                    catch (asyncErr) {
                        this.logger.warn(`Async post-turn processing failed: ${asyncErr.message}`);
                    }
                });
            }
            catch (err) {
                this.logger.error(`Message turn failed: ${err.message}`);
                send({ type: 'error', message: err.message });
                res.end();
            }
        });
    }
    async contextPreview(chatId, q) {
        const chat = this.chatRepo.getChatById(chatId);
        if (!chat)
            throw new common_1.NotFoundException(`Chat ${chatId} not found`);
        const query = q || '';
        const plan = this.contextRouter.analyzeQuery(chatId, query);
        const activeContext = await this.contextBuilder.build(plan, chatId, chat.total_tokens, query);
        return {
            budgetBreakdown: activeContext.budgetBreakdown,
            candidateCount: activeContext.sourceIds.length,
            selectedSources: activeContext.sourceIds,
            estimatedTokens: activeContext.totalTokens,
            slots: activeContext.slots.map(s => ({ name: s.name, tokenCount: s.tokenCount })),
        };
    }
    async getChatMemories(chatId, type, status) {
        const chat = this.chatRepo.getChatById(chatId);
        if (!chat)
            throw new common_1.NotFoundException(`Chat ${chatId} not found`);
        const memories = await this.memoryService.listMemories(chatId, type, status);
        return memories.map(memory => ({
            ...memory,
            source_message_ids: this.parseJsonArray(memory.source_message_ids),
            rejected_alternatives: memory.rejected_alternatives
                ? this.parseJsonArray(memory.rejected_alternatives)
                : null,
            task_dependencies: memory.task_dependencies
                ? this.parseJsonArray(memory.task_dependencies)
                : null,
        }));
    }
    async forceRollover(chatId) {
        const chat = this.chatRepo.getChatById(chatId);
        if (!chat)
            throw new common_1.NotFoundException(`Chat ${chatId} not found`);
        const activeEpoch = await this.epochService.getActiveEpoch(chatId);
        if (!activeEpoch) {
            return { message: 'No active epoch to roll over', chatId };
        }
        await this.executeRollover(chatId, activeEpoch.id, chat.total_tokens);
        const newEpoch = await this.epochService.getActiveEpoch(chatId);
        return {
            message: 'Rollover completed',
            chatId,
            closedEpochId: activeEpoch.id,
            newEpochId: newEpoch?.id,
        };
    }
    async getRetrievalEvents(chatId, page, limit) {
        const chat = this.chatRepo.getChatById(chatId);
        if (!chat)
            throw new common_1.NotFoundException(`Chat ${chatId} not found`);
        const events = await this.observability.listRetrievalEvents(chatId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
        return events.map(event => ({
            ...event,
            candidates: this.parseJsonArray(event.candidates),
            selected: this.parseJsonArray(event.selected),
        }));
    }
    async executeRollover(chatId, epochId, currentTokens) {
        try {
            await this.epochService.closeEpoch(epochId, currentTokens);
            const capsule = await this.capsuleService.buildCapsule(chatId, epochId, 'CHUNK');
            await this.epochService.setCapsule(epochId, capsule.id);
            const newEpoch = await this.epochService.createEpoch(chatId, currentTokens);
            this.chatRepo.updateChatActiveEpoch(chatId, newEpoch.id);
            this.logger.log(`Rollover complete: closed ${epochId}, new epoch ${newEpoch.id}`);
        }
        catch (err) {
            this.logger.error(`Rollover failed: ${err.message}`);
        }
    }
    validateCreateChatDto(dto) {
        if (!dto || typeof dto.title !== 'string' || !dto.title.trim()) {
            throw new common_1.BadRequestException({
                message: 'title must be a non-empty string',
                code: 'INVALID_CHAT_TITLE',
            });
        }
        if (typeof dto.modelProfileId !== 'string' || !dto.modelProfileId.trim()) {
            throw new common_1.BadRequestException({
                message: 'modelProfileId must be a non-empty string',
                code: 'INVALID_MODEL_PROFILE_ID',
            });
        }
    }
    validateSendMessageDto(dto) {
        if (!dto || typeof dto.content !== 'string') {
            throw new common_1.BadRequestException({
                message: 'content must be a string',
                code: 'INVALID_MESSAGE_CONTENT',
            });
        }
        if (!dto.content.trim()) {
            throw new common_1.BadRequestException({
                message: 'content must not be empty or whitespace',
                code: 'EMPTY_MESSAGE_CONTENT',
            });
        }
        if (dto.role && !Object.values(types_1.MessageRole).includes(dto.role)) {
            throw new common_1.BadRequestException({
                message: `role must be one of: ${Object.values(types_1.MessageRole).join(', ')}`,
                code: 'INVALID_MESSAGE_ROLE',
            });
        }
        return dto.content;
    }
    parseJsonArray(value) {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    async enqueueChatTurn(chatId, work) {
        const previous = this.chatTurnQueues.get(chatId) ?? Promise.resolve();
        const current = previous.catch(() => undefined).then(work);
        this.chatTurnQueues.set(chatId, current);
        try {
            await current;
        }
        finally {
            if (this.chatTurnQueues.get(chatId) === current) {
                this.chatTurnQueues.delete(chatId);
            }
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('model-profiles'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createModelProfile", null);
__decorate([
    (0, common_1.Get)('model-profiles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listModelProfiles", null);
__decorate([
    (0, common_1.Get)('model-profiles/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getModelProfile", null);
__decorate([
    (0, common_1.Post)('chats'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createChat", null);
__decorate([
    (0, common_1.Get)('chats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listChats", null);
__decorate([
    (0, common_1.Get)('chats/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChat", null);
__decorate([
    (0, common_1.Get)('chats/:id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChatMessages", null);
__decorate([
    (0, common_1.Get)('chats/:id/epochs'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChatEpochs", null);
__decorate([
    (0, common_1.Get)('chats/:id/capsules'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChatCapsules", null);
__decorate([
    (0, common_1.Post)('chats/:id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('chats/:id/context-preview'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "contextPreview", null);
__decorate([
    (0, common_1.Get)('chats/:id/memories'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChatMemories", null);
__decorate([
    (0, common_1.Post)('chats/:id/rollover'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "forceRollover", null);
__decorate([
    (0, common_1.Get)('chats/:id/retrieval-events'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getRetrievalEvents", null);
exports.ChatController = ChatController = ChatController_1 = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        chat_repository_1.ChatRepository,
        message_store_service_1.MessageStoreService,
        epoch_service_1.EpochService,
        token_budget_service_1.TokenBudgetService,
        context_router_service_1.ContextRouterService,
        active_context_builder_service_1.ActiveContextBuilderService,
        memory_service_1.MemoryService,
        memory_extractor_service_1.MemoryExtractorService,
        capsule_service_1.CapsuleService,
        indexing_service_1.IndexingService,
        embeddings_service_1.EmbeddingsService,
        observability_service_1.ObservabilityService,
        tokenizer_service_1.TokenizerService,
        config_1.ConfigService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map