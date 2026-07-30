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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const chat_repository_1 = require("./chat.repository");
const epoch_service_1 = require("../epoch/epoch.service");
let ChatService = ChatService_1 = class ChatService {
    constructor(chatRepo, epochService) {
        this.chatRepo = chatRepo;
        this.epochService = epochService;
        this.logger = new common_1.Logger(ChatService_1.name);
    }
    async createModelProfile(dto) {
        try {
            return this.chatRepo.createModelProfile({
                name: dto.name,
                context_size: dto.context_size,
                tokenizer_id: dto.tokenizer_id,
                chat_template: dto.chat_template,
                kv_format: dto.kv_format ?? 'q8_0',
                llama_server_url: dto.llama_server_url ?? 'http://localhost:8080',
            });
        }
        catch (err) {
            this.logger.error(`Failed to create model profile: ${err.message}`);
            throw err;
        }
    }
    async listModelProfiles() {
        return this.chatRepo.listModelProfiles();
    }
    async getModelProfile(id) {
        const profile = this.chatRepo.getModelProfileById(id);
        if (!profile)
            throw new common_1.NotFoundException(`Model profile ${id} not found`);
        return profile;
    }
    async createChat(dto) {
        try {
            const profile = this.chatRepo.getModelProfileById(dto.modelProfileId);
            if (!profile)
                throw new common_1.NotFoundException(`Model profile ${dto.modelProfileId} not found`);
            const chat = this.chatRepo.createChat({
                title: dto.title,
                modelProfileId: dto.modelProfileId,
            });
            const epoch = await this.epochService.createEpoch(chat.id, 0);
            this.chatRepo.updateChatActiveEpoch(chat.id, epoch.id);
            return this.chatRepo.getChatById(chat.id);
        }
        catch (err) {
            this.logger.error(`Failed to create chat: ${err.message}`);
            throw err;
        }
    }
    async listChats() {
        return this.chatRepo.listChats();
    }
    async getChat(id) {
        const chat = this.chatRepo.getChatById(id);
        if (!chat)
            throw new common_1.NotFoundException(`Chat ${id} not found`);
        return chat;
    }
    async getChatOrThrow(id) {
        return this.getChat(id);
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_repository_1.ChatRepository,
        epoch_service_1.EpochService])
], ChatService);
//# sourceMappingURL=chat.service.js.map