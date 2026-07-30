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
var ChatCompletionsInterceptorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatCompletionsInterceptorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_service_1 = require("../shared/database/database.service");
const llama_proxy_service_1 = require("./llama-proxy.service");
const active_context_builder_service_1 = require("../active-context/active-context-builder.service");
const context_router_service_1 = require("../context-router/context-router.service");
const message_store_service_1 = require("../message-store/message-store.service");
const epoch_service_1 = require("../epoch/epoch.service");
const token_budget_service_1 = require("../token-budget/token-budget.service");
const embeddings_service_1 = require("../embeddings/embeddings.service");
const indexing_service_1 = require("../indexing/indexing.service");
const memory_extractor_service_1 = require("../memory/memory-extractor.service");
const capsule_service_1 = require("../capsule/capsule.service");
const chat_repository_1 = require("../chat/chat.repository");
const tokenizer_service_1 = require("../shared/tokenizer/tokenizer.service");
const types_1 = require("../shared/types");
const uuid_1 = require("uuid");
let ChatCompletionsInterceptorService = ChatCompletionsInterceptorService_1 = class ChatCompletionsInterceptorService {
    constructor(db, config, llamaProxy, contextBuilder, contextRouter, messageStore, epochService, tokenBudget, embeddingsService, indexingService, memoryExtractor, capsuleService, chatRepo, tokenizerService) {
        this.db = db;
        this.config = config;
        this.llamaProxy = llamaProxy;
        this.contextBuilder = contextBuilder;
        this.contextRouter = contextRouter;
        this.messageStore = messageStore;
        this.epochService = epochService;
        this.tokenBudget = tokenBudget;
        this.embeddingsService = embeddingsService;
        this.indexingService = indexingService;
        this.memoryExtractor = memoryExtractor;
        this.capsuleService = capsuleService;
        this.chatRepo = chatRepo;
        this.tokenizerService = tokenizerService;
        this.logger = new common_1.Logger(ChatCompletionsInterceptorService_1.name);
    }
    async intercept(body, reqHeaders, res) {
        const isStreaming = body.stream === true;
        const chatId = await this.resolveChat(body);
        const chat = this.chatRepo.getChatById(chatId);
        if (!chat) {
            await this.proxyDirect(body, res, isStreaming);
            return;
        }
        const userMessage = this.extractLastUserMessage(body.messages);
        if (!userMessage) {
            await this.proxyDirect(body, res, isStreaming);
            return;
        }
        try {
            let epoch = await this.epochService.getActiveEpoch(chatId);
            if (!epoch) {
                epoch = await this.epochService.createEpoch(chatId, chat.total_tokens);
                this.chatRepo.updateChatActiveEpoch(chatId, epoch.id);
            }
            const savedUserMsg = await this.messageStore.saveMessage({
                chatId,
                epochId: epoch.id,
                role: types_1.MessageRole.USER,
                content: userMessage,
            });
            if (this.tokenBudget.shouldRollover(chat.total_tokens)) {
                this.logger.log(`Rollover triggered for chat ${chatId}`);
                await this.executeRollover(chatId, epoch.id, chat.total_tokens);
                epoch = await this.epochService.getActiveEpoch(chatId);
                if (!epoch) {
                    epoch = await this.epochService.createEpoch(chatId, chat.total_tokens);
                    this.chatRepo.updateChatActiveEpoch(chatId, epoch.id);
                }
            }
            const plan = this.contextRouter.analyzeQuery(chatId, userMessage);
            const activeCtx = await this.contextBuilder.build(plan, chatId, chat.total_tokens, userMessage);
            const enrichedMessages = this.injectMemory(body.messages, activeCtx);
            const modifiedBody = { ...body, messages: enrichedMessages };
            const assistantContent = await this.streamToClient(modifiedBody, res, isStreaming);
            const userTokenCount = await this.tokenizerService.countTokens(userMessage);
            const assistantTokenCount = await this.tokenizerService.countTokens(assistantContent);
            const totalTokens = userTokenCount + assistantTokenCount;
            const latestEpoch = await this.epochService.getActiveEpoch(chatId);
            if (latestEpoch) {
                const assistantMsg = await this.messageStore.saveMessage({
                    chatId,
                    epochId: latestEpoch.id,
                    role: types_1.MessageRole.ASSISTANT,
                    content: assistantContent,
                });
                await this.messageStore.markCompleted(savedUserMsg.id, chat.total_tokens, chat.total_tokens + userTokenCount, userTokenCount);
                await this.messageStore.markCompleted(assistantMsg.id, chat.total_tokens + userTokenCount, chat.total_tokens + totalTokens, assistantTokenCount);
                this.chatRepo.incrementChatTokens(chatId, totalTokens);
                Promise.resolve().then(async () => {
                    try {
                        const userEmb = await this.embeddingsService.embed(userMessage);
                        if (userEmb.length)
                            this.indexingService.addMessage(savedUserMsg.id, userEmb);
                        const asEmb = await this.embeddingsService.embed(assistantContent);
                        if (asEmb.length) {
                            this.indexingService.addMessage(assistantMsg.id, asEmb);
                            this.indexingService.saveIndexes();
                        }
                        const userMsgRow = await this.messageStore.getById(savedUserMsg.id);
                        const asMsgRow = await this.messageStore.getById(assistantMsg.id);
                        if (userMsgRow)
                            await this.memoryExtractor.extractFromMessage(chatId, userMsgRow);
                        if (asMsgRow)
                            await this.memoryExtractor.extractFromMessage(chatId, asMsgRow);
                        const updatedChat = this.chatRepo.getChatById(chatId);
                        if (updatedChat && latestEpoch) {
                            const capsuleType = await this.capsuleService.shouldBuildCapsule(chatId, updatedChat.total_tokens);
                            if (capsuleType) {
                                await this.capsuleService.buildCapsule(chatId, latestEpoch.id, capsuleType);
                            }
                        }
                    }
                    catch (err) {
                        this.logger.warn(`Async post-processing failed: ${err.message}`);
                    }
                });
            }
        }
        catch (err) {
            this.logger.error(`Intercept failed, falling back to direct proxy: ${err.message}`);
            await this.proxyDirect(body, res, isStreaming);
        }
    }
    extractLastUserMessage(messages) {
        const userMsgs = messages.filter(m => m.role === 'user');
        if (!userMsgs.length)
            return null;
        const last = userMsgs[userMsgs.length - 1];
        if (typeof last.content === 'string')
            return last.content;
        if (Array.isArray(last.content)) {
            return last.content
                .filter(p => p.type === 'text')
                .map(p => p.text ?? '')
                .join('\n');
        }
        return null;
    }
    injectMemory(messages, activeCtx) {
        const memoryLines = activeCtx.slots
            .filter(s => s.name !== 'system_prompt' && s.content.trim())
            .map(s => s.content);
        if (!memoryLines.length)
            return messages;
        const memoryBlock = `\n\n[CONTEXT MEMORY — retrieved from previous conversation]\n` +
            memoryLines.join('\n\n') +
            `\n[END CONTEXT MEMORY]\n`;
        const systemIdx = messages.findIndex(m => m.role === 'system');
        if (systemIdx >= 0) {
            const existing = typeof messages[systemIdx].content === 'string' ? messages[systemIdx].content : '';
            return [
                ...messages.slice(0, systemIdx),
                { role: 'system', content: existing + memoryBlock },
                ...messages.slice(systemIdx + 1),
            ];
        }
        return [{ role: 'system', content: memoryBlock.trim() }, ...messages];
    }
    async streamToClient(body, res, isStreaming) {
        const llamaUrl = this.llamaProxy.getLlamaUrl();
        let assistantContent = '';
        const upstream = await fetch(`${llamaUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: isStreaming ? 'text/event-stream' : 'application/json',
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(120_000),
        });
        if (!upstream.ok) {
            throw new Error(`llama.cpp returned HTTP ${upstream.status}`);
        }
        if (isStreaming && upstream.body) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Transfer-Encoding', 'chunked');
            if (typeof res.flushHeaders === 'function') {
                res.flushHeaders();
            }
            const reader = upstream.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value, { stream: true });
                res.write(chunk);
                for (const line of chunk.split('\n')) {
                    if (!line.startsWith('data: '))
                        continue;
                    const json = line.slice(6).trim();
                    if (json === '[DONE]')
                        continue;
                    try {
                        const parsed = JSON.parse(json);
                        const delta = parsed?.choices?.[0]?.delta?.content ?? '';
                        assistantContent += delta;
                    }
                    catch { }
                }
            }
            res.end();
        }
        else {
            const json = (await upstream.json());
            assistantContent = json?.choices?.[0]?.message?.content ?? '';
            res.json(json);
        }
        return assistantContent;
    }
    async proxyDirect(body, res, isStreaming) {
        const llamaUrl = this.llamaProxy.getLlamaUrl();
        try {
            const upstream = await fetch(`${llamaUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(120_000),
            });
            if (isStreaming && upstream.body) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                if (typeof res.flushHeaders === 'function') {
                    res.flushHeaders();
                }
                const reader = upstream.body.getReader();
                const decoder = new TextDecoder();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    res.write(decoder.decode(value, { stream: true }));
                }
                res.end();
            }
            else {
                const json = await upstream.json();
                res.json(json);
            }
        }
        catch (err) {
            if (!res.headersSent) {
                res.status(502).json({ error: 'llama.cpp unreachable', message: err.message });
            }
        }
    }
    async resolveChat(body) {
        const hint = body.user;
        if (hint) {
            const existing = this.chatRepo.getChatById(hint);
            if (existing)
                return hint;
        }
        const modelName = body.model ?? 'default';
        const profiles = this.db.all('SELECT id FROM model_profiles LIMIT 1');
        let profileId;
        if (profiles.length > 0) {
            profileId = profiles[0].id;
        }
        else {
            profileId = (0, uuid_1.v4)();
            this.db.run(`INSERT INTO model_profiles (id, name, context_size, llama_server_url) VALUES (?, ?, ?, ?)`, [
                profileId,
                modelName,
                32768,
                this.config.get('contextVault.llamaServerUrl', 'http://localhost:8080'),
            ]);
        }
        const chatId = hint ?? (0, uuid_1.v4)();
        this.db.run(`INSERT INTO chats (id, title, model_profile_id) VALUES (?, ?, ?)`, [chatId, `Chat with ${modelName}`, profileId]);
        const epoch = await this.epochService.createEpoch(chatId, 0);
        this.chatRepo.updateChatActiveEpoch(chatId, epoch.id);
        return chatId;
    }
    async executeRollover(chatId, epochId, currentTokens) {
        try {
            await this.epochService.closeEpoch(epochId, currentTokens);
            const capsule = await this.capsuleService.buildCapsule(chatId, epochId, 'CHUNK');
            await this.epochService.setCapsule(epochId, capsule.id);
            const newEpoch = await this.epochService.createEpoch(chatId, currentTokens);
            this.chatRepo.updateChatActiveEpoch(chatId, newEpoch.id);
        }
        catch (err) {
            this.logger.error(`Rollover failed for chat ${chatId}: ${err.message}`);
        }
    }
};
exports.ChatCompletionsInterceptorService = ChatCompletionsInterceptorService;
exports.ChatCompletionsInterceptorService = ChatCompletionsInterceptorService = ChatCompletionsInterceptorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        config_1.ConfigService,
        llama_proxy_service_1.LlamaProxyService,
        active_context_builder_service_1.ActiveContextBuilderService,
        context_router_service_1.ContextRouterService,
        message_store_service_1.MessageStoreService,
        epoch_service_1.EpochService,
        token_budget_service_1.TokenBudgetService,
        embeddings_service_1.EmbeddingsService,
        indexing_service_1.IndexingService,
        memory_extractor_service_1.MemoryExtractorService,
        capsule_service_1.CapsuleService,
        chat_repository_1.ChatRepository,
        tokenizer_service_1.TokenizerService])
], ChatCompletionsInterceptorService);
//# sourceMappingURL=chat-completions-interceptor.service.js.map