import { DatabaseService } from '../shared/database/database.service';
import { MessageRow } from '../shared/database/database.types';
export declare class MessageRepository {
    private readonly db;
    constructor(db: DatabaseService);
    create(data: {
        chatId: string;
        epochId: string;
        role: string;
        content: string;
        importance?: number;
    }): MessageRow;
    getById(id: string): MessageRow | undefined;
    getByEpochId(epochId: string): MessageRow[];
    getByChatId(chatId: string, limit?: number): MessageRow[];
    getRecentTail(chatId: string, limit: number): MessageRow[];
    updateStatus(id: string, status: string): void;
    updateTokenInfo(id: string, tokenStart: number, tokenEnd: number, tokenCount: number): void;
    updateEmbeddingId(id: string, embeddingId: string): void;
    updateImportance(id: string, importance: number): void;
    getByIds(ids: string[]): MessageRow[];
    getAllWithEmbedding(chatId?: string): MessageRow[];
    getRowidById(id: string): number | undefined;
    getByRowid(rowid: number): MessageRow | undefined;
}
