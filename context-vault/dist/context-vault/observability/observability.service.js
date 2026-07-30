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
var ObservabilityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservabilityService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../shared/database/database.service");
const uuid_1 = require("uuid");
const fs = require("fs");
const path = require("path");
const config_1 = require("@nestjs/config");
let ObservabilityService = ObservabilityService_1 = class ObservabilityService {
    constructor(db, configService) {
        this.db = db;
        this.configService = configService;
        this.logger = new common_1.Logger(ObservabilityService_1.name);
        const storageRoot = this.configService.get('contextVault.storageRoot', './data/context-vault');
        this.logDir = path.resolve(storageRoot, 'logs');
        fs.mkdirSync(this.logDir, { recursive: true });
    }
    async saveRetrievalEvent(data) {
        try {
            const id = (0, uuid_1.v4)();
            this.db.run(`INSERT INTO retrieval_events
          (id, chat_id, message_id, query, retrieval_type, candidates, selected, total_tokens_retrieved, latency_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                id,
                data.chatId,
                data.messageId ?? null,
                data.query,
                data.retrievalType,
                JSON.stringify(data.candidates.slice(0, 20)),
                JSON.stringify(data.selected),
                data.totalTokensRetrieved ?? null,
                data.latencyMs ?? null,
            ]);
        }
        catch (err) {
            this.logger.warn(`Failed to save retrieval event: ${err.message}`);
        }
    }
    async listRetrievalEvents(chatId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        return this.db.all('SELECT * FROM retrieval_events WHERE chat_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [chatId, limit, offset]);
    }
    writeJsonlLog(filename, data) {
        try {
            const logPath = path.join(this.logDir, filename);
            fs.appendFileSync(logPath, JSON.stringify({ ...data, ts: new Date().toISOString() }) + '\n');
        }
        catch (_err) {
        }
    }
    async getMetrics() {
        try {
            const chatCount = this.db.get('SELECT COUNT(*) as count FROM chats')?.count ?? 0;
            const messageCount = this.db.get('SELECT COUNT(*) as count FROM messages')?.count ?? 0;
            const memoryCount = this.db.get('SELECT COUNT(*) as count FROM memory_items WHERE status = ?', ['ACTIVE'])?.count ?? 0;
            const capsuleCount = this.db.get('SELECT COUNT(*) as count FROM capsules')?.count ?? 0;
            const epochCount = this.db.get('SELECT COUNT(*) as count FROM epochs')?.count ?? 0;
            const totalTokens = this.db.get('SELECT SUM(total_tokens) as total FROM chats')?.total ?? 0;
            return {
                chats: chatCount,
                messages: messageCount,
                activeMemoryItems: memoryCount,
                capsules: capsuleCount,
                epochs: epochCount,
                totalTokensAcrossChats: totalTokens,
                timestamp: new Date().toISOString(),
            };
        }
        catch (err) {
            this.logger.error(`Failed to compute metrics: ${err.message}`);
            return { error: err.message };
        }
    }
};
exports.ObservabilityService = ObservabilityService;
exports.ObservabilityService = ObservabilityService = ObservabilityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        config_1.ConfigService])
], ObservabilityService);
//# sourceMappingURL=observability.service.js.map