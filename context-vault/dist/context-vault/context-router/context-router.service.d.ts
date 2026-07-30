import { RetrievalPlan } from '../shared/types';
export declare class ContextRouterService {
    private readonly logger;
    analyzeQuery(chatId: string, query: string): RetrievalPlan;
    private detectIntent;
    private detectProject;
}
