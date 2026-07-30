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
var EpochService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpochService = void 0;
const common_1 = require("@nestjs/common");
const epoch_repository_1 = require("./epoch.repository");
let EpochService = EpochService_1 = class EpochService {
    constructor(epochRepo) {
        this.epochRepo = epochRepo;
        this.logger = new common_1.Logger(EpochService_1.name);
    }
    async createEpoch(chatId, tokenStart = 0) {
        try {
            const latestSeq = this.epochRepo.getLatestSequence(chatId);
            const sequence = latestSeq + 1;
            const epoch = this.epochRepo.create(chatId, sequence, tokenStart);
            this.logger.log(`Created epoch ${epoch.id} (seq=${sequence}) for chat ${chatId}`);
            return epoch;
        }
        catch (err) {
            this.logger.error(`Failed to create epoch: ${err.message}`);
            throw err;
        }
    }
    async getActiveEpoch(chatId) {
        return this.epochRepo.getActiveByChatId(chatId);
    }
    async getEpochById(id) {
        return this.epochRepo.getById(id);
    }
    async listEpochs(chatId) {
        return this.epochRepo.listByChatId(chatId);
    }
    async closeEpoch(epochId, tokenEnd) {
        try {
            this.epochRepo.close(epochId, tokenEnd);
            this.logger.log(`Closed epoch ${epochId} at token ${tokenEnd}`);
        }
        catch (err) {
            this.logger.error(`Failed to close epoch: ${err.message}`);
            throw err;
        }
    }
    async setCapsule(epochId, capsuleId) {
        this.epochRepo.setCapsule(epochId, capsuleId);
    }
};
exports.EpochService = EpochService;
exports.EpochService = EpochService = EpochService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [epoch_repository_1.EpochRepository])
], EpochService);
//# sourceMappingURL=epoch.service.js.map