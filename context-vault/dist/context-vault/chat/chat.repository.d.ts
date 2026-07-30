import { DatabaseService } from '../shared/database/database.service';
import { ChatRow, ModelProfileRow } from '../shared/database/database.types';
export declare class ChatRepository {
    private readonly db;
    constructor(db: DatabaseService);
    createModelProfile(data: Partial<ModelProfileRow>): ModelProfileRow;
    getModelProfileById(id: string): ModelProfileRow | undefined;
    listModelProfiles(): ModelProfileRow[];
    createChat(data: {
        title: string;
        modelProfileId: string;
    }): ChatRow;
    getChatById(id: string): ChatRow | undefined;
    listChats(): ChatRow[];
    updateChatActiveEpoch(chatId: string, epochId: string): void;
    updateChatTokens(chatId: string, totalTokens: number): void;
    incrementChatTokens(chatId: string, delta: number): void;
}
