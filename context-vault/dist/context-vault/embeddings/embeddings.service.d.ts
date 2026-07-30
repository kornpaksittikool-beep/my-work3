import { ConfigService } from '@nestjs/config';
export declare class EmbeddingsService {
    private readonly configService;
    private readonly logger;
    private readonly llamaServerUrl;
    constructor(configService: ConfigService);
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
}
