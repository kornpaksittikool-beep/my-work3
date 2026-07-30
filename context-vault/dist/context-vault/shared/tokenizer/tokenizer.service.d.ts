import { ConfigService } from '@nestjs/config';
export declare class TokenizerService {
    private readonly configService;
    private readonly logger;
    private readonly cache;
    private readonly maxCacheSize;
    private readonly llamaServerUrl;
    constructor(configService: ConfigService);
    countTokens(text: string, _modelProfileId?: string): Promise<number>;
    countTokensBatch(texts: string[]): Promise<number[]>;
    private fallbackCount;
    private cacheSet;
}
