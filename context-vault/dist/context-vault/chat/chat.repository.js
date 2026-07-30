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
exports.ChatRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../shared/database/database.service");
const uuid_1 = require("uuid");
let ChatRepository = class ChatRepository {
    constructor(db) {
        this.db = db;
    }
    createModelProfile(data) {
        const id = data.id || (0, uuid_1.v4)();
        this.db.run(`INSERT INTO model_profiles (id, name, context_size, tokenizer_id, chat_template, kv_format, llama_server_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            id,
            data.name,
            data.context_size,
            data.tokenizer_id ?? null,
            data.chat_template ?? null,
            data.kv_format ?? 'q8_0',
            data.llama_server_url ?? 'http://localhost:8080',
        ]);
        return this.getModelProfileById(id);
    }
    getModelProfileById(id) {
        return this.db.get('SELECT * FROM model_profiles WHERE id = ?', [id]);
    }
    listModelProfiles() {
        return this.db.all('SELECT * FROM model_profiles ORDER BY created_at DESC');
    }
    createChat(data) {
        const id = (0, uuid_1.v4)();
        this.db.run(`INSERT INTO chats (id, title, model_profile_id, total_tokens, status)
       VALUES (?, ?, ?, 0, 'ACTIVE')`, [id, data.title, data.modelProfileId]);
        return this.getChatById(id);
    }
    getChatById(id) {
        return this.db.get('SELECT * FROM chats WHERE id = ?', [id]);
    }
    listChats() {
        return this.db.all("SELECT * FROM chats WHERE status != 'DELETED' ORDER BY updated_at DESC");
    }
    updateChatActiveEpoch(chatId, epochId) {
        this.db.run("UPDATE chats SET active_epoch_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [epochId, chatId]);
    }
    updateChatTokens(chatId, totalTokens) {
        this.db.run("UPDATE chats SET total_tokens = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [totalTokens, chatId]);
    }
    incrementChatTokens(chatId, delta) {
        this.db.run("UPDATE chats SET total_tokens = total_tokens + ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [delta, chatId]);
    }
};
exports.ChatRepository = ChatRepository;
exports.ChatRepository = ChatRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ChatRepository);
//# sourceMappingURL=chat.repository.js.map