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
var KeywordRetrieverService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeywordRetrieverService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../shared/database/database.service");
let KeywordRetrieverService = KeywordRetrieverService_1 = class KeywordRetrieverService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(KeywordRetrieverService_1.name);
    }
    searchMessages(query, chatId, k) {
        if (!query.trim())
            return [];
        try {
            const ftsQuery = this.buildFtsQuery(query);
            const rows = this.db.all(`SELECT m.id, m.content, m.importance, fts.rank
         FROM messages_fts fts
         JOIN messages m ON m.rowid = fts.rowid
         WHERE messages_fts MATCH ? AND m.chat_id = ?
         ORDER BY fts.rank
         LIMIT ?`, [ftsQuery, chatId, k]);
            return rows.map(row => ({
                id: row.id,
                score: this.normalizeRank(row.rank),
                content_preview: row.content.slice(0, 200),
                source_type: 'message',
            }));
        }
        catch (err) {
            this.logger.warn(`Keyword search (messages) failed: ${err.message}`);
            return [];
        }
    }
    searchMemory(query, chatId, k) {
        if (!query.trim())
            return [];
        try {
            const ftsQuery = this.buildFtsQuery(query);
            const rows = this.db.all(`SELECT m.id, m.content, m.confidence, fts.rank
         FROM memory_items_fts fts
         JOIN memory_items m ON m.rowid = fts.rowid
         WHERE memory_items_fts MATCH ? AND m.chat_id = ? AND m.status = 'ACTIVE'
         ORDER BY fts.rank
         LIMIT ?`, [ftsQuery, chatId, k]);
            return rows.map(row => ({
                id: row.id,
                score: this.normalizeRank(row.rank),
                content_preview: row.content.slice(0, 200),
                source_type: 'memory',
            }));
        }
        catch (err) {
            this.logger.warn(`Keyword search (memory) failed: ${err.message}`);
            return [];
        }
    }
    buildFtsQuery(query) {
        const terms = query
            .replace(/['"*^()]/g, ' ')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map(t => `"${t}"`)
            .join(' OR ');
        return terms || '""';
    }
    normalizeRank(rank) {
        return Math.min(1, Math.max(0, 1 / (1 + Math.abs(rank))));
    }
};
exports.KeywordRetrieverService = KeywordRetrieverService;
exports.KeywordRetrieverService = KeywordRetrieverService = KeywordRetrieverService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], KeywordRetrieverService);
//# sourceMappingURL=keyword-retriever.service.js.map