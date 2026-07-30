import { ConfigService } from '@nestjs/config';
import { BudgetBreakdown, RolloverState } from '../shared/types';
export declare class TokenBudgetService {
    private readonly configService;
    private readonly logger;
    private readonly modelContextSize;
    private readonly reservedOutputTokens;
    private readonly emergencyReserveTokens;
    private readonly rolloverHighWatermark;
    constructor(configService: ConfigService);
    computeBudget(totalChatTokens: number): BudgetBreakdown;
    getRolloverState(usagePercent: number): RolloverState;
    shouldRollover(totalChatTokens: number): boolean;
    getMaxRetrievedTokens(rolloverState: RolloverState): number;
}
