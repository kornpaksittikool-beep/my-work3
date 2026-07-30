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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../shared/database/database.service");
const uuid_1 = require("uuid");
let MessageRepository = class MessageRepository {
    constructor(db) {
        this.db = db;
    }
    create(data) {
        const id = (0, uuid_1.v4)();
        this.db.run(`INSERT INTO messages (id, chat_id, epoch_id, role, content, importance, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`, [id, data.chatId, data.epochId, data.role, data.content, data.importance ?? 0.5]);
        return this.getById(id);
    }
    getById(id) {
        return this.db.get('SELECT * FROM messages WHERE id = ?', [id]);
    }
    getByEpochId(epochId) {
        return this.db.all('SELECT * FROM messages WHERE epoch_id = ? ORDER BY created_at ASC', [epochId]);
    }
    getByChatId(chatId, limit) {
        const sql = limit
            ? 'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT ?'
            : 'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC';
        return this.db.all(sql, limit ? [chatId, limit] : [chatId]);
    }
    getRecentTail(chatId, limit) {
        const rows = this.db.all('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT ?', [chatId, limit]);
        return rows.reverse();
    }
    updateStatus(id, status) {
        this.db.run('UPDATE messages SET status = ? WHERE id = ?', [status, id]);
    }
    updateTokenInfo(id, tokenStart, tokenEnd, tokenCount) {
        this.db.run('UPDATE messages SET token_start = ?, token_end = ?, token_count = ? WHERE id = ?', [tokenStart, tokenEnd, tokenCount, id]);
    }
    updateEmbeddingId(id, embeddingId) {
        this.db.run('UPDATE messages SET embedding_id = ? WHERE id = ?', [embeddingId, id]);
    }
    updateImportance(id, importance) {
        this.db.run('UPDATE messages SET importance = ? WHERE id = ?', [importance, id]);
    }
    getByIds(ids) {
        if (!ids.length)
            return [];
        const placeholders = ids.map(() => '?').join(',');
        return this.db.all(`SELECT * FROM messages WHERE id IN (${placeholders})`, ids);
    }
    getAllWithEmbedding(chatId) {
        if (chatId) {
            return this.db.all('SELECT * FROM messages WHERE chat_id = ? AND embedding_id IS NOT NULL', [chatId]);
        }
        return this.db.all('SELECT * FROM messages WHERE embedding_id IS NOT NULL');
    }
    getRowidById(id) {
        const row = this.db.get('SELECT rowid FROM messages WHERE id = ?', [id]);
        return row?.rowid;
    }
    getByRowid(rowid) {
        return this.db.get('SELECT * FROM messages WHERE rowid = ?', [rowid]);
    }
};
exports.MessageRepository = MessageRepository;
exports.MessageRepository = MessageRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], MessageRepository);
//# sourceMappingURL=message.repository.js.map