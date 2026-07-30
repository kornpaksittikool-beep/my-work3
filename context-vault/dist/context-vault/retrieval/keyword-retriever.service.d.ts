import { DatabaseService } from '../shared/database/database.service';
import { RetrievalCandidate } from '../shared/types';
export declare class KeywordRetrieverService {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    searchMessages(query: string, chatId: string, k: number): RetrievalCandidate[];
    searchMemory(query: string, chatId: string, k: number): RetrievalCandidate[];
    private buildFtsQuery;
    private normalizeRank;
}
