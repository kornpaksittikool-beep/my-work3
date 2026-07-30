import { TokenizerService } from '../shared/tokenizer/tokenizer.service';
import { MessageRepository } from '../message-store/message.repository';
import { MemoryRepository } from '../memory/memory.repository';
import { RetrievalCandidate, ScoredCandidate } from '../shared/types';
interface MergeInput {
    candidates: RetrievalCandidate[];
    type: 'keyword' | 'semantic' | 'structured' | 'capsule';
}
export declare class RerankerService {
    private readonly tokenizerService;
    private readonly messageRepo;
    private readonly memoryRepo;
    private readonly logger;
    constructor(tokenizerService: TokenizerService, messageRepo: MessageRepository, memoryRepo: MemoryRepository);
    rerank(inputs: MergeInput[], chatId: string, topK: number, maxTokens: number, currentProject?: string): Promise<ScoredCandidate[]>;
}
export {};
