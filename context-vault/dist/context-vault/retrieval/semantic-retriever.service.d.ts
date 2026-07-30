import { EmbeddingsService } from '../embeddings/embeddings.service';
import { IndexingService } from '../indexing/indexing.service';
import { MessageRepository } from '../message-store/message.repository';
import { RetrievalCandidate } from '../shared/types';
export declare class SemanticRetrieverService {
    private readonly embeddingsService;
    private readonly indexingService;
    private readonly messageRepo;
    private readonly logger;
    constructor(embeddingsService: EmbeddingsService, indexingService: IndexingService, messageRepo: MessageRepository);
    searchMessages(query: string, chatId: string, k: number): Promise<RetrievalCandidate[]>;
    searchCapsules(query: string, chatId: string, k: number): Promise<RetrievalCandidate[]>;
}
