import { MemoryService } from './memory.service';
import { UpdateMemoryDto } from '../shared/types';
export declare class MemoryController {
    private readonly memoryService;
    private readonly logger;
    constructor(memoryService: MemoryService);
    updateMemory(id: string, dto: UpdateMemoryDto): Promise<import("../shared/database/database.types").MemoryItemRow>;
}
