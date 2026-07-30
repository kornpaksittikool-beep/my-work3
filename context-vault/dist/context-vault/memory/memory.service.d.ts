import { MemoryRepository } from './memory.repository';
import { MemoryItemRow } from '../shared/database/database.types';
import { MemoryType, MemoryStatus, UpdateMemoryDto } from '../shared/types';
export declare class MemoryService {
    private readonly memoryRepo;
    private readonly logger;
    constructor(memoryRepo: MemoryRepository);
    listMemories(chatId: string, type?: MemoryType, status?: MemoryStatus): Promise<MemoryItemRow[]>;
    getMemory(id: string): Promise<MemoryItemRow | undefined>;
    updateMemory(id: string, dto: UpdateMemoryDto): Promise<MemoryItemRow | undefined>;
}
