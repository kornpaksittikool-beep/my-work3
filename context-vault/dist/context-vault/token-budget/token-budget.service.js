"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TokenBudgetService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenBudgetService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const types_1 = require("../shared/types");
let TokenBudgetService = TokenBudgetService_1 = class TokenBudgetService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(TokenBudgetService_1.name);
        this.modelContextSize = this.configService.get('contextVault.modelContextSize', 32768);
        this.reservedOutputTokens = this.configService.get('contextVault.reservedOutputTokens', 6144);
        this.emergencyReserveTokens = this.configService.get('contextVault.emergencyReserveTokens', 1024);
        this.rolloverHighWatermark = this.configService.get('contextVault.rolloverHighWatermark', 0.82);
    }
    computeBudget(totalChatTokens) {
        const usagePercent = totalChatTokens / this.modelContextSize;
        const rolloverState = this.getRolloverState(usagePercent);
        const systemPrompt = 3000;
        const permanentRules = 3000;
        const workingSummary = 3000;
        const reservedOutput = this.reservedOutputTokens;
        const emergencyReserve = this.emergencyReserveTokens;
        const budgetForContent = this.modelContextSize - reservedOutput - emergencyReserve;
        let recentConversation;
        let retrievedEvidence;
        if (rolloverState === types_1.RolloverState.EMERGENCY) {
            recentConversation = 6000;
            retrievedEvidence = 4000;
        }
        else if (rolloverState === types_1.RolloverState.ROLLOVER) {
            recentConversation = 10000;
            retrievedEvidence = 8000;
        }
        else {
            recentConversation = 12000;
            retrievedEvidence = 12000;
        }
        const fixedBudget = systemPrompt + permanentRules + workingSummary + reservedOutput + emergencyReserve;
        const desiredDynamicBudget = recentConversation + retrievedEvidence;
        const availableDynamicBudget = Math.max(0, this.modelContextSize - fixedBudget);
        if (desiredDynamicBudget > availableDynamicBudget) {
            const scale = availableDynamicBudget / desiredDynamicBudget;
            recentConversation = Math.floor(recentConversation * scale);
            retrievedEvidence = Math.floor(retrievedEvidence * scale);
        }
        const totalFixed = fixedBudget + recentConversation + retrievedEvidence;
        const available = Math.max(0, this.modelContextSize - totalFixed);
        return {
            systemPrompt,
            permanentRules,
            recentConversation,
            retrievedEvidence,
            workingSummary,
            reservedOutput,
            emergencyReserve,
            available,
            totalUsed: totalFixed,
            modelContextSize: this.modelContextSize,
            usagePercent,
            rolloverState,
        };
    }
    getRolloverState(usagePercent) {
        if (usagePercent > this.rolloverHighWatermark)
            return types_1.RolloverState.EMERGENCY;
        if (usagePercent > this.rolloverHighWatermark - 0.02)
            return types_1.RolloverState.ROLLOVER;
        if (usagePercent > 0.70)
            return types_1.RolloverState.PREPARE;
        return types_1.RolloverState.NORMAL;
    }
    shouldRollover(totalChatTokens) {
        const state = this.getRolloverState(totalChatTokens / this.modelContextSize);
        return state === types_1.RolloverState.ROLLOVER || state === types_1.RolloverState.EMERGENCY;
    }
    getMaxRetrievedTokens(rolloverState) {
        if (rolloverState === types_1.RolloverState.EMERGENCY)
            return 4000;
        if (rolloverState === types_1.RolloverState.ROLLOVER)
            return 8000;
        return this.configService.get('contextVault.maxRetrievedTokens', 12000);
    }
};
exports.TokenBudgetService = TokenBudgetService;
exports.TokenBudgetService = TokenBudgetService = TokenBudgetService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TokenBudgetService);
//# sourceMappingURL=token-budget.service.js.map