import { IndexingService } from '../indexing/indexing.service';
export declare class IndexController {
    private readonly indexingService;
    private readonly logger;
    constructor(indexingService: IndexingService);
    rebuild(chatId?: string): Promise<{
        message: string;
        chatId: string;
    }>;
}
