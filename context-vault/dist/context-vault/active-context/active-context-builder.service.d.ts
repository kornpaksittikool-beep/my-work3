import { ConfigService } from '@nestjs/config';
import { KeywordRetrieverService } from '../retrieval/keyword-retriever.service';
import { SemanticRetrieverService } from '../retrieval/semantic-retriever.service';
import { StructuredMemoryRetrieverService } from '../retrieval/structured-memory-retriever.service';
import { RerankerService } from '../retrieval/reranker.service';
import { CapsuleRepository } from '../capsule/capsule.repository';
import { TokenizerService } from '../shared/tokenizer/tokenizer.service';
import { TokenBudgetService } from '../token-budget/token-budget.service';
import { MessageRepository } from '../message-store/message.repository';
import { ActiveContext, RetrievalPlan } from '../shared/types';
export declare class ActiveContextBuilderService {
    private readonly keywordRetriever;
    private readonly semanticRetriever;
    private readonly structuredRetriever;
    private readonly reranker;
    private readonly capsuleRepo;
    private readonly messageRepo;
    private readonly tokenizerService;
    private readonly tokenBudget;
    private readonly configService;
    private readonly logger;
    constructor(keywordRetriever: KeywordRetrieverService, semanticRetriever: SemanticRetrieverService, structuredRetriever: StructuredMemoryRetrieverService, reranker: RerankerService, capsuleRepo: CapsuleRepository, messageRepo: MessageRepository, tokenizerService: TokenizerService, tokenBudget: TokenBudgetService, configService: ConfigService);
    build(plan: RetrievalPlan, chatId: string, totalChatTokens: number, userMessage: string): Promise<ActiveContext>;
    buildPromptString(context: ActiveContext, userMessage: string): string;
}
