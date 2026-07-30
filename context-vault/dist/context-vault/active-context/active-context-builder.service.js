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
var ActiveContextBuilderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveContextBuilderService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const keyword_retriever_service_1 = require("../retrieval/keyword-retriever.service");
const semantic_retriever_service_1 = require("../retrieval/semantic-retriever.service");
const structured_memory_retriever_service_1 = require("../retrieval/structured-memory-retriever.service");
const reranker_service_1 = require("../retrieval/reranker.service");
const capsule_repository_1 = require("../capsule/capsule.repository");
const tokenizer_service_1 = require("../shared/tokenizer/tokenizer.service");
const token_budget_service_1 = require("../token-budget/token-budget.service");
const message_repository_1 = require("../message-store/message.repository");
let ActiveContextBuilderService = ActiveContextBuilderService_1 = class ActiveContextBuilderService {
    constructor(keywordRetriever, semanticRetriever, structuredRetriever, reranker, capsuleRepo, messageRepo, tokenizerService, tokenBudget, configService) {
        this.keywordRetriever = keywordRetriever;
        this.semanticRetriever = semanticRetriever;
        this.structuredRetriever = structuredRetriever;
        this.reranker = reranker;
        this.capsuleRepo = capsuleRepo;
        this.messageRepo = messageRepo;
        this.tokenizerService = tokenizerService;
        this.tokenBudget = tokenBudget;
        this.configService = configService;
        this.logger = new common_1.Logger(ActiveContextBuilderService_1.name);
    }
    async build(plan, chatId, totalChatTokens, userMessage) {
        const budget = this.tokenBudget.computeBudget(totalChatTokens);
        const maxRetrieved = this.tokenBudget.getMaxRetrievedTokens(budget.rolloverState);
        const topK = this.configService.get('contextVault.rerankTopK', 12);
        const keywordK = this.configService.get('contextVault.keywordTopK', 30);
        const semanticK = this.configService.get('contextVault.semanticTopK', 30);
        const inputs = [];
        if (plan.enableKeyword) {
            const kwMessages = this.keywordRetriever.searchMessages(userMessage, chatId, keywordK);
            const kwMemory = this.keywordRetriever.searchMemory(userMessage, chatId, keywordK);
            inputs.push({ candidates: [...kwMessages, ...kwMemory], type: 'keyword' });
        }
        if (plan.enableSemantic) {
            const semMessages = await this.semanticRetriever.searchMessages(userMessage, chatId, semanticK);
            inputs.push({ candidates: semMessages, type: 'semantic' });
        }
        if (plan.enableStructured) {
            const structured = this.structuredRetriever.retrieve(chatId, 20);
            inputs.push({ candidates: structured, type: 'structured' });
        }
        const ranked = await this.reranker.rerank(inputs, chatId, topK, maxRetrieved, plan.project);
        const slots = [];
        const allSourceIds = [];
        const systemContent = 'You are a helpful AI assistant with access to conversation memory.';
        const systemTokens = await this.tokenizerService.countTokens(systemContent);
        slots.push({ name: 'system_prompt', content: systemContent, tokenCount: systemTokens, sourceIds: [] });
        const rules = this.structuredRetriever.retrieveRules(chatId);
        if (rules.length) {
            const rulesContent = '## Active Rules\n' + rules.map(r => `- ${r.content_preview}`).join('\n');
            const rulesTokens = await this.tokenizerService.countTokens(rulesContent);
            slots.push({ name: 'permanent_rules', content: rulesContent, tokenCount: rulesTokens, sourceIds: rules.map(r => r.id) });
            allSourceIds.push(...rules.map(r => r.id));
        }
        const latestCapsule = this.capsuleRepo.getLatestByChatId(chatId);
        if (latestCapsule) {
            const summaryContent = `## Previous Context Summary\n${latestCapsule.summary}`;
            const summaryTokens = await this.tokenizerService.countTokens(summaryContent);
            slots.push({ name: 'working_summary', content: summaryContent, tokenCount: summaryTokens, sourceIds: [latestCapsule.id] });
            allSourceIds.push(latestCapsule.id);
        }
        if (ranked.length) {
            const evidenceLines = ranked.map(c => `[SOURCE:${c.id}] ${c.content.slice(0, 500)}`);
            const evidenceContent = '## Retrieved Context\n' + evidenceLines.join('\n\n');
            const evidenceTokens = ranked.reduce((sum, c) => sum + (c.token_count ?? 0), 0);
            slots.push({ name: 'retrieved_evidence', content: evidenceContent, tokenCount: evidenceTokens, sourceIds: ranked.map(c => c.id) });
            allSourceIds.push(...ranked.map(c => c.id));
        }
        const recentTailLimit = this.configService.get('contextVault.recentTailTokens', 4096);
        const recentMessages = this.messageRepo.getRecentTail(chatId, 20);
        let recentContent = '';
        let recentTokens = 0;
        const recentIds = [];
        for (const msg of recentMessages) {
            const line = `[${msg.role.toUpperCase()}]: ${msg.content}`;
            const t = await this.tokenizerService.countTokens(line);
            if (recentTokens + t > recentTailLimit)
                break;
            recentContent += line + '\n\n';
            recentTokens += t;
            recentIds.push(msg.id);
        }
        if (recentContent) {
            slots.push({ name: 'recent_conversation', content: '## Recent Conversation\n' + recentContent.trim(), tokenCount: recentTokens, sourceIds: recentIds });
            allSourceIds.push(...recentIds);
        }
        const totalTokens = slots.reduce((sum, s) => sum + s.tokenCount, 0);
        return {
            slots,
            totalTokens,
            sourceIds: [...new Set(allSourceIds)],
            budgetBreakdown: budget,
            retrievalCandidates: ranked.map(candidate => ({
                id: candidate.id,
                score: candidate.final_score,
                content_preview: candidate.content_preview,
                token_count: candidate.token_count,
                source_type: candidate.source_type,
            })),
            selectedItems: ranked.map(candidate => ({
                id: candidate.id,
                score: candidate.final_score,
                slot: 'retrieved_evidence',
            })),
        };
    }
    buildPromptString(context, userMessage) {
        const parts = context.slots.map(s => s.content);
        parts.push(`## User Message\n${userMessage}`);
        return parts.join('\n\n---\n\n');
    }
};
exports.ActiveContextBuilderService = ActiveContextBuilderService;
exports.ActiveContextBuilderService = ActiveContextBuilderService = ActiveContextBuilderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [keyword_retriever_service_1.KeywordRetrieverService,
        semantic_retriever_service_1.SemanticRetrieverService,
        structured_memory_retriever_service_1.StructuredMemoryRetrieverService,
        reranker_service_1.RerankerService,
        capsule_repository_1.CapsuleRepository,
        message_repository_1.MessageRepository,
        tokenizer_service_1.TokenizerService,
        token_budget_service_1.TokenBudgetService,
        config_1.ConfigService])
], ActiveContextBuilderService);
//# sourceMappingURL=active-context-builder.service.js.map