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
var MemoryExtractorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryExtractorService = void 0;
const common_1 = require("@nestjs/common");
const memory_repository_1 = require("./memory.repository");
const types_1 = require("../shared/types");
let MemoryExtractorService = MemoryExtractorService_1 = class MemoryExtractorService {
    constructor(memoryRepo) {
        this.memoryRepo = memoryRepo;
        this.logger = new common_1.Logger(MemoryExtractorService_1.name);
        this.rulePatterns = [
            /\b(must|always|never|required|mandatory|should not|do not|don't)\b/i,
        ];
        this.decisionPatterns = [
            /\b(decided|chose|will use|going with|selected|picked|opted for)\b/i,
        ];
        this.taskPatterns = [
            /\b(todo|to do|need to|should implement|should add|should create|should fix|will implement|implement|create a|add a|fix the)\b/i,
        ];
    }
    async extractFromMessage(chatId, message) {
        if (message.role !== 'assistant' && message.role !== 'user')
            return;
        try {
            const items = this.extractItems(message.content);
            for (const item of items) {
                this.memoryRepo.create({
                    chatId,
                    type: item.type,
                    content: item.content,
                    confidence: item.confidence,
                    sourceMessageIds: [message.id],
                });
            }
            if (items.length) {
                this.logger.debug(`Extracted ${items.length} memory items from message ${message.id}`);
            }
        }
        catch (err) {
            this.logger.warn(`Memory extraction failed for message ${message.id}: ${err.message}`);
        }
    }
    extractItems(content) {
        const items = [];
        const sentences = content
            .split(/[.!?\n]/)
            .map(s => s.trim())
            .filter(s => s.length > 10 && s.length < 500);
        for (const sentence of sentences) {
            if (this.rulePatterns.some(p => p.test(sentence))) {
                items.push({ type: types_1.MemoryType.RULE, content: sentence, confidence: 0.75 });
            }
            else if (this.decisionPatterns.some(p => p.test(sentence))) {
                items.push({ type: types_1.MemoryType.DECISION, content: sentence, confidence: 0.8 });
            }
            else if (this.taskPatterns.some(p => p.test(sentence))) {
                items.push({ type: types_1.MemoryType.TASK, content: sentence, confidence: 0.7 });
            }
        }
        return items.slice(0, 5);
    }
};
exports.MemoryExtractorService = MemoryExtractorService;
exports.MemoryExtractorService = MemoryExtractorService = MemoryExtractorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [memory_repository_1.MemoryRepository])
], MemoryExtractorService);
//# sourceMappingURL=memory-extractor.service.js.map