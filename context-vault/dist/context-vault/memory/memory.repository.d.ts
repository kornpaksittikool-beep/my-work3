import { DatabaseService } from '../shared/database/database.service';
import { MemoryItemRow } from '../shared/database/database.types';
import { MemoryStatus, MemoryType } from '../shared/types';
export declare class MemoryRepository {
    private readonly db;
    constructor(db: DatabaseService);
    create(data: {
        chatId: string;
        type: MemoryType;
        content: string;
        confidence?: number;
        sourceMessageIds?: string[];
        project?: string;
        taskStatus?: string;
        rejectedAlternatives?: string[];
    }): MemoryItemRow;
    getById(id: string): MemoryItemRow | undefined;
    getByChatId(chatId: string, type?: MemoryType, status?: MemoryStatus): MemoryItemRow[];
    update(id: string, data: {
        status?: string;
        content?: string;
        confidence?: number;
        taskStatus?: string;
        nextAction?: string;
    }): void;
    getByIds(ids: string[]): MemoryItemRow[];
    getByRowid(rowid: number): MemoryItemRow | undefined;
}
