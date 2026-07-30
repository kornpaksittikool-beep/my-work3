import { ConfigService } from '@nestjs/config';
export declare class LlamaProxyService {
    private readonly config;
    private readonly logger;
    private readonly llamaUrl;
    constructor(config: ConfigService);
    getLlamaUrl(): string;
    forward(method: string, path: string, headers: Record<string, string>, body?: string): Promise<Response>;
}
