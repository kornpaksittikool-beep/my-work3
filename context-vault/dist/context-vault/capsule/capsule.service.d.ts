import { ConfigService } from '@nestjs/config';
import { CapsuleRepository } from './capsule.repository';
import { MessageRepository } from '../message-store/message.repository';
import { MemoryRepository } from '../memory/memory.repository';
import { IndexingService } from '../indexing/indexing.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { TokenizerService } from '../shared/tokenizer/tokenizer.service';
import { CapsuleRow } from '../shared/database/database.types';
import { CapsuleType } from '../shared/types';
export declare class CapsuleService {
    private readonly capsuleRepo;
    private readonly messageRepo;
    private readonly memoryRepo;
    private readonly indexingService;
    private readonly embeddingsService;
    private readonly tokenizerService;
    private readonly configService;
    private readonly logger;
    private readonly llamaServerUrl;
    constructor(capsuleRepo: CapsuleRepository, messageRepo: MessageRepository, memoryRepo: MemoryRepository, indexingService: IndexingService, embeddingsService: EmbeddingsService, tokenizerService: TokenizerService, configService: ConfigService);
    buildCapsule(chatId: string, epochId: string, type: CapsuleType): Promise<CapsuleRow>;
    private summarize;
    private simpleSummary;
    getLatestCapsule(chatId: string): Promise<CapsuleRow | undefined>;
    getCapsulesByChat(chatId: string): Promise<CapsuleRow[]>;
    shouldBuildCapsule(chatId: string, currentTokens: number): Promise<CapsuleType | null>;
}
