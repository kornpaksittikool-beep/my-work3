import { MessageRepository } from './message.repository';
import { MessageRow } from '../shared/database/database.types';
export declare class MessageStoreService {
    private readonly messageRepo;
    private readonly logger;
    constructor(messageRepo: MessageRepository);
    saveMessage(data: {
        chatId: string;
        epochId: string;
        role: string;
        content: string;
        importance?: number;
    }): Promise<MessageRow>;
    getById(id: string): Promise<MessageRow | undefined>;
    getByEpoch(epochId: string): Promise<MessageRow[]>;
    getByChat(chatId: string, limit?: number): Promise<MessageRow[]>;
    getRecentTail(chatId: string, limit: number): Promise<MessageRow[]>;
    markCompleted(id: string, tokenStart: number, tokenEnd: number, tokenCount: number): Promise<void>;
    markFailed(id: string, tokenStart?: number, tokenEnd?: number, tokenCount?: number): Promise<void>;
    setEmbeddingId(messageId: string, embeddingId: string): Promise<void>;
    getByIds(ids: string[]): Promise<MessageRow[]>;
    getAllWithEmbedding(chatId?: string): Promise<MessageRow[]>;
    getByRowid(rowid: number): Promise<MessageRow | undefined>;
}
