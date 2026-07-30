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
exports.CapsuleRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../shared/database/database.service");
const uuid_1 = require("uuid");
let CapsuleRepository = class CapsuleRepository {
    constructor(db) {
        this.db = db;
    }
    create(data) {
        const id = (0, uuid_1.v4)();
        this.db.run(`INSERT INTO capsules (id, chat_id, epoch_id, type, summary, open_tasks, constraints, source_message_ids, token_start, token_end, token_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            id,
            data.chatId,
            data.epochId ?? null,
            data.type,
            data.summary,
            JSON.stringify(data.openTasks ?? []),
            JSON.stringify(data.constraints ?? []),
            JSON.stringify(data.sourceMessageIds ?? []),
            data.tokenStart ?? null,
            data.tokenEnd ?? null,
            data.tokenCount ?? null,
        ]);
        return this.getById(id);
    }
    getById(id) {
        return this.db.get('SELECT * FROM capsules WHERE id = ?', [id]);
    }
    getByChatId(chatId) {
        return this.db.all('SELECT * FROM capsules WHERE chat_id = ? ORDER BY created_at ASC', [chatId]);
    }
    getLatestByChatId(chatId) {
        return this.db.get('SELECT * FROM capsules WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1', [chatId]);
    }
    getAll() {
        return this.db.all('SELECT * FROM capsules ORDER BY created_at ASC');
    }
    updateEmbeddingId(id, embeddingId) {
        this.db.run('UPDATE capsules SET embedding_id = ? WHERE id = ?', [embeddingId, id]);
    }
    getByRowid(rowid) {
        return this.db.get('SELECT * FROM capsules WHERE rowid = ?', [rowid]);
    }
};
exports.CapsuleRepository = CapsuleRepository;
exports.CapsuleRepository = CapsuleRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], CapsuleRepository);
//# sourceMappingURL=capsule.repository.js.map