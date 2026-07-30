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
var MemoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryService = void 0;
const common_1 = require("@nestjs/common");
const memory_repository_1 = require("./memory.repository");
let MemoryService = MemoryService_1 = class MemoryService {
    constructor(memoryRepo) {
        this.memoryRepo = memoryRepo;
        this.logger = new common_1.Logger(MemoryService_1.name);
    }
    async listMemories(chatId, type, status) {
        return this.memoryRepo.getByChatId(chatId, type, status);
    }
    async getMemory(id) {
        return this.memoryRepo.getById(id);
    }
    async updateMemory(id, dto) {
        try {
            this.memoryRepo.update(id, {
                status: dto.status,
                content: dto.content,
                confidence: dto.confidence,
                taskStatus: dto.task_status,
                nextAction: dto.next_action,
            });
            return this.memoryRepo.getById(id);
        }
        catch (err) {
            this.logger.error(`Failed to update memory ${id}: ${err.message}`);
            throw err;
        }
    }
};
exports.MemoryService = MemoryService;
exports.MemoryService = MemoryService = MemoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [memory_repository_1.MemoryRepository])
], MemoryService);
//# sourceMappingURL=memory.service.js.map