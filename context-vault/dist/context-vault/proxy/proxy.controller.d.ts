import { Request, Response } from 'express';
import { LlamaProxyService } from './llama-proxy.service';
import { ChatCompletionsInterceptorService } from './chat-completions-interceptor.service';
export declare class ProxyController {
    private readonly llamaProxy;
    private readonly interceptor;
    private readonly logger;
    constructor(llamaProxy: LlamaProxyService, interceptor: ChatCompletionsInterceptorService);
    private buildForwardHeaders;
    chatCompletions(req: Request, res: Response): Promise<void>;
    passThrough(req: Request, res: Response): Promise<void>;
}
