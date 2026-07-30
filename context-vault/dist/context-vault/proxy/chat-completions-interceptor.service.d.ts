import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../shared/database/database.service';
import { LlamaProxyService } from './llama-proxy.service';
import { ActiveContextBuilderService } from '../active-context/active-context-builder.service';
import { ContextRouterService } from '../context-router/context-router.service';
import { MessageStoreService } from '../message-store/message-store.service';
import { EpochService } from '../epoch/epoch.service';
import { TokenBudgetService } from '../token-budget/token-budget.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { IndexingService } from '../indexing/indexing.service';
import { MemoryExtractorService } from '../memory/memory-extractor.service';
import { CapsuleService } from '../capsule/capsule.service';
import { ChatRepository } from '../chat/chat.repository';
import { TokenizerService } from '../shared/tokenizer/tokenizer.service';
import { Response } from 'express';
interface OpenAIMessage {
    role: string;
    content: string | Array<{
        type: string;
        text?: string;
    }>;
}
interface ChatCompletionRequest {
    model?: string;
    messages: OpenAIMessage[];
    stream?: boolean;
    user?: string;
    [key: string]: unknown;
}
export declare class ChatCompletionsInterceptorService {
    private readonly db;
    private readonly config;
    private readonly llamaProxy;
    private readonly contextBuilder;
    private readonly contextRouter;
    private readonly messageStore;
    private readonly epochService;
    private readonly tokenBudget;
    private readonly embeddingsService;
    private readonly indexingService;
    private readonly memoryExtractor;
    private readonly capsuleService;
    private readonly chatRepo;
    private readonly tokenizerService;
    private readonly logger;
    constructor(db: DatabaseService, config: ConfigService, llamaProxy: LlamaProxyService, contextBuilder: ActiveContextBuilderService, contextRouter: ContextRouterService, messageStore: MessageStoreService, epochService: EpochService, tokenBudget: TokenBudgetService, embeddingsService: EmbeddingsService, indexingService: IndexingService, memoryExtractor: MemoryExtractorService, capsuleService: CapsuleService, chatRepo: ChatRepository, tokenizerService: TokenizerService);
    intercept(body: ChatCompletionRequest, reqHeaders: Record<string, string>, res: Response): Promise<void>;
    private extractLastUserMessage;
    private injectMemory;
    private streamToClient;
    private proxyDirect;
    private resolveChat;
    private executeRollover;
}
export {};
