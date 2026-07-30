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
var StructuredMemoryRetrieverService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredMemoryRetrieverService = void 0;
const common_1 = require("@nestjs/common");
const memory_repository_1 = require("../memory/memory.repository");
const types_1 = require("../shared/types");
let StructuredMemoryRetrieverService = StructuredMemoryRetrieverService_1 = class StructuredMemoryRetrieverService {
    constructor(memoryRepo) {
        this.memoryRepo = memoryRepo;
        this.logger = new common_1.Logger(StructuredMemoryRetrieverService_1.name);
    }
    retrieve(chatId, k) {
        try {
            const items = this.memoryRepo.getByChatId(chatId, undefined, types_1.MemoryStatus.ACTIVE);
            return items.slice(0, k).map(item => ({
                id: item.id,
                score: item.confidence,
                content_preview: item.content.slice(0, 200),
                source_type: 'memory',
            }));
        }
        catch (err) {
            this.logger.warn(`Structured memory retrieval failed: ${err.message}`);
            return [];
        }
    }
    retrieveRules(chatId) {
        try {
            const items = this.memoryRepo.getByChatId(chatId, types_1.MemoryType.RULE, types_1.MemoryStatus.ACTIVE);
            return items.map(item => ({
                id: item.id,
                score: item.confidence,
                content_preview: item.content.slice(0, 200),
                source_type: 'memory',
            }));
        }
        catch (err) {
            this.logger.warn(`Rule retrieval failed: ${err.message}`);
            return [];
        }
    }
};
exports.StructuredMemoryRetrieverService = StructuredMemoryRetrieverService;
exports.StructuredMemoryRetrieverService = StructuredMemoryRetrieverService = StructuredMemoryRetrieverService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [memory_repository_1.MemoryRepository])
], StructuredMemoryRetrieverService);
//# sourceMappingURL=structured-memory-retriever.service.js.map