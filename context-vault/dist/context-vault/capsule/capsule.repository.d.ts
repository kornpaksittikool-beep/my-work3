import { DatabaseService } from '../shared/database/database.service';
import { CapsuleRow } from '../shared/database/database.types';
export declare class CapsuleRepository {
    private readonly db;
    constructor(db: DatabaseService);
    create(data: {
        chatId: string;
        epochId?: string;
        type: string;
        summary: string;
        openTasks?: string[];
        constraints?: string[];
        sourceMessageIds?: string[];
        tokenStart?: number;
        tokenEnd?: number;
        tokenCount?: number;
    }): CapsuleRow;
    getById(id: string): CapsuleRow | undefined;
    getByChatId(chatId: string): CapsuleRow[];
    getLatestByChatId(chatId: string): CapsuleRow | undefined;
    getAll(): CapsuleRow[];
    updateEmbeddingId(id: string, embeddingId: string): void;
    getByRowid(rowid: number): CapsuleRow | undefined;
}
