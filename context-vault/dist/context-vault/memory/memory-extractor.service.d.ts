import { MemoryRepository } from './memory.repository';
import { MessageRow } from '../shared/database/database.types';
export declare class MemoryExtractorService {
    private readonly memoryRepo;
    private readonly logger;
    private readonly rulePatterns;
    private readonly decisionPatterns;
    private readonly taskPatterns;
    constructor(memoryRepo: MemoryRepository);
    extractFromMessage(chatId: string, message: MessageRow): Promise<void>;
    private extractItems;
}
