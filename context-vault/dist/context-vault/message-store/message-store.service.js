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
var MessageStoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageStoreService = void 0;
const common_1 = require("@nestjs/common");
const message_repository_1 = require("./message.repository");
const types_1 = require("../shared/types");
let MessageStoreService = MessageStoreService_1 = class MessageStoreService {
    constructor(messageRepo) {
        this.messageRepo = messageRepo;
        this.logger = new common_1.Logger(MessageStoreService_1.name);
    }
    async saveMessage(data) {
        try {
            return this.messageRepo.create(data);
        }
        catch (err) {
            this.logger.error(`Failed to save message: ${err.message}`);
            throw err;
        }
    }
    async getById(id) {
        return this.messageRepo.getById(id);
    }
    async getByEpoch(epochId) {
        return this.messageRepo.getByEpochId(epochId);
    }
    async getByChat(chatId, limit) {
        return this.messageRepo.getByChatId(chatId, limit);
    }
    async getRecentTail(chatId, limit) {
        return this.messageRepo.getRecentTail(chatId, limit);
    }
    async markCompleted(id, tokenStart, tokenEnd, tokenCount) {
        try {
            this.messageRepo.updateStatus(id, types_1.MessageStatus.COMPLETED);
            this.messageRepo.updateTokenInfo(id, tokenStart, tokenEnd, tokenCount);
        }
        catch (err) {
            this.logger.error(`Failed to mark message completed: ${err.message}`);
        }
    }
    async markFailed(id, tokenStart, tokenEnd, tokenCount) {
        this.messageRepo.updateStatus(id, types_1.MessageStatus.FAILED);
        if (tokenStart !== undefined &&
            tokenEnd !== undefined &&
            tokenCount !== undefined) {
            this.messageRepo.updateTokenInfo(id, tokenStart, tokenEnd, tokenCount);
        }
    }
    async setEmbeddingId(messageId, embeddingId) {
        this.messageRepo.updateEmbeddingId(messageId, embeddingId);
    }
    async getByIds(ids) {
        return this.messageRepo.getByIds(ids);
    }
    async getAllWithEmbedding(chatId) {
        return this.messageRepo.getAllWithEmbedding(chatId);
    }
    async getByRowid(rowid) {
        return this.messageRepo.getByRowid(rowid);
    }
};
exports.MessageStoreService = MessageStoreService;
exports.MessageStoreService = MessageStoreService = MessageStoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [message_repository_1.MessageRepository])
], MessageStoreService);
//# sourceMappingURL=message-store.service.js.map