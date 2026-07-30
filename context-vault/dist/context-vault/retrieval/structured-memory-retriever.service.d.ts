import { MemoryRepository } from '../memory/memory.repository';
import { RetrievalCandidate } from '../shared/types';
export declare class StructuredMemoryRetrieverService {
    private readonly memoryRepo;
    private readonly logger;
    constructor(memoryRepo: MemoryRepository);
    retrieve(chatId: string, k: number): RetrievalCandidate[];
    retrieveRules(chatId: string): RetrievalCandidate[];
}
