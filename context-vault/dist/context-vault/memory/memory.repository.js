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
exports.MemoryRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../shared/database/database.service");
const uuid_1 = require("uuid");
let MemoryRepository = class MemoryRepository {
    constructor(db) {
        this.db = db;
    }
    create(data) {
        const id = (0, uuid_1.v4)();
        this.db.run(`INSERT INTO memory_items
        (id, chat_id, type, content, confidence, status, source_message_ids, project, task_status, rejected_alternatives)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)`, [
            id,
            data.chatId,
            data.type,
            data.content,
            data.confidence ?? 0.8,
            JSON.stringify(data.sourceMessageIds ?? []),
            data.project ?? null,
            data.taskStatus ?? null,
            data.rejectedAlternatives ? JSON.stringify(data.rejectedAlternatives) : null,
        ]);
        return this.getById(id);
    }
    getById(id) {
        return this.db.get('SELECT * FROM memory_items WHERE id = ?', [id]);
    }
    getByChatId(chatId, type, status) {
        if (type && status) {
            return this.db.all('SELECT * FROM memory_items WHERE chat_id = ? AND type = ? AND status = ? ORDER BY created_at DESC', [chatId, type, status]);
        }
        if (type) {
            return this.db.all('SELECT * FROM memory_items WHERE chat_id = ? AND type = ? ORDER BY created_at DESC', [chatId, type]);
        }
        if (status) {
            return this.db.all('SELECT * FROM memory_items WHERE chat_id = ? AND status = ? ORDER BY created_at DESC', [chatId, status]);
        }
        return this.db.all('SELECT * FROM memory_items WHERE chat_id = ? ORDER BY created_at DESC', [chatId]);
    }
    update(id, data) {
        const updates = [];
        const params = [];
        if (data.status !== undefined) {
            updates.push('status = ?');
            params.push(data.status);
        }
        if (data.content !== undefined) {
            updates.push('content = ?');
            params.push(data.content);
        }
        if (data.confidence !== undefined) {
            updates.push('confidence = ?');
            params.push(data.confidence);
        }
        if (data.taskStatus !== undefined) {
            updates.push('task_status = ?');
            params.push(data.taskStatus);
        }
        if (data.nextAction !== undefined) {
            updates.push('next_action = ?');
            params.push(data.nextAction);
        }
        if (!updates.length)
            return;
        updates.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
        params.push(id);
        this.db.run(`UPDATE memory_items SET ${updates.join(', ')} WHERE id = ?`, params);
    }
    getByIds(ids) {
        if (!ids.length)
            return [];
        const ph = ids.map(() => '?').join(',');
        return this.db.all(`SELECT * FROM memory_items WHERE id IN (${ph})`, ids);
    }
    getByRowid(rowid) {
        return this.db.get('SELECT * FROM memory_items WHERE rowid = ?', [rowid]);
    }
};
exports.MemoryRepository = MemoryRepository;
exports.MemoryRepository = MemoryRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], MemoryRepository);
//# sourceMappingURL=memory.repository.js.map