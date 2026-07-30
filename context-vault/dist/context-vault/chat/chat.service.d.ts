import { ChatRepository } from './chat.repository';
import { ChatRow, ModelProfileRow } from '../shared/database/database.types';
import { EpochService } from '../epoch/epoch.service';
import { CreateChatDto, CreateModelProfileDto } from '../shared/types';
export declare class ChatService {
    private readonly chatRepo;
    private readonly epochService;
    private readonly logger;
    constructor(chatRepo: ChatRepository, epochService: EpochService);
    createModelProfile(dto: CreateModelProfileDto): Promise<ModelProfileRow>;
    listModelProfiles(): Promise<ModelProfileRow[]>;
    getModelProfile(id: string): Promise<ModelProfileRow>;
    createChat(dto: CreateChatDto): Promise<ChatRow>;
    listChats(): Promise<ChatRow[]>;
    getChat(id: string): Promise<ChatRow>;
    getChatOrThrow(id: string): Promise<ChatRow>;
}
