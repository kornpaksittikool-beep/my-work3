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
exports.EpochRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../shared/database/database.service");
const uuid_1 = require("uuid");
let EpochRepository = class EpochRepository {
    constructor(db) {
        this.db = db;
    }
    create(chatId, sequence, tokenStart = 0) {
        const id = (0, uuid_1.v4)();
        this.db.run(`INSERT INTO epochs (id, chat_id, sequence, token_start, state) VALUES (?, ?, ?, ?, 'OPEN')`, [id, chatId, sequence, tokenStart]);
        return this.getById(id);
    }
    getById(id) {
        return this.db.get('SELECT * FROM epochs WHERE id = ?', [id]);
    }
    getActiveByChatId(chatId) {
        return this.db.get("SELECT * FROM epochs WHERE chat_id = ? AND state = 'OPEN' ORDER BY sequence DESC LIMIT 1", [chatId]);
    }
    listByChatId(chatId) {
        return this.db.all('SELECT * FROM epochs WHERE chat_id = ? ORDER BY sequence ASC', [chatId]);
    }
    close(id, tokenEnd) {
        this.db.run(`UPDATE epochs SET state = 'CLOSED', token_end = ?, closed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`, [tokenEnd, id]);
    }
    setCapsule(epochId, capsuleId) {
        this.db.run('UPDATE epochs SET capsule_id = ? WHERE id = ?', [capsuleId, epochId]);
    }
    getLatestSequence(chatId) {
        const row = this.db.get('SELECT MAX(sequence) as seq FROM epochs WHERE chat_id = ?', [chatId]);
        return row?.seq ?? -1;
    }
};
exports.EpochRepository = EpochRepository;
exports.EpochRepository = EpochRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], EpochRepository);
//# sourceMappingURL=epoch.repository.js.map