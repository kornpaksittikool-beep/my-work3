import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { MessageRepository } from '../message-store/message.repository';
import { CapsuleRepository } from '../capsule/capsule.repository';
export declare class IndexingService implements OnModuleInit {
    private readonly configService;
    private readonly embeddingsService;
    private readonly messageRepo;
    private readonly capsuleRepo;
    private readonly logger;
    private messagesIndex;
    private capsulesIndex;
    private messagesMap;
    private capsulesMap;
    private readonly storageRoot;
    private readonly dimension;
    private readonly indexDir;
    private HnswLib;
    constructor(configService: ConfigService, embeddingsService: EmbeddingsService, messageRepo: MessageRepository, capsuleRepo: CapsuleRepository);
    onModuleInit(): Promise<void>;
    private createNewIndex;
    loadIndexes(): Promise<void>;
    saveIndexes(): void;
    private saveMap;
    addMessage(id: string, embedding: number[]): void;
    searchMessages(embedding: number[], k: number): Array<{
        id: string;
        score: number;
    }>;
    addCapsule(id: string, embedding: number[]): void;
    searchCapsules(embedding: number[], k: number): Array<{
        id: string;
        score: number;
    }>;
    rebuild(chatId?: string): Promise<void>;
}
