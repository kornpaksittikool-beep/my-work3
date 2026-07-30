import { DatabaseService } from '../shared/database/database.service';
import { RetrievalEventRow } from '../shared/database/database.types';
import { RetrievalCandidate, RetrievalType } from '../shared/types';
import { ConfigService } from '@nestjs/config';
export declare class ObservabilityService {
    private readonly db;
    private readonly configService;
    private readonly logger;
    private readonly logDir;
    constructor(db: DatabaseService, configService: ConfigService);
    saveRetrievalEvent(data: {
        chatId: string;
        messageId?: string;
        query: string;
        retrievalType: RetrievalType;
        candidates: RetrievalCandidate[];
        selected: Array<{
            id: string;
            score: number;
            slot: string;
        }>;
        totalTokensRetrieved?: number;
        latencyMs?: number;
    }): Promise<void>;
    listRetrievalEvents(chatId: string, page?: number, limit?: number): Promise<RetrievalEventRow[]>;
    writeJsonlLog(filename: string, data: object): void;
    getMetrics(): Promise<object>;
}
