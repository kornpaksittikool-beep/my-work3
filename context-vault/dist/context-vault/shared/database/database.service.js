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
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const BetterSqlite3 = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(DatabaseService_1.name);
    }
    async onModuleInit() {
        const storageRoot = this.configService.get('contextVault.storageRoot', './data/context-vault');
        const dbDir = path.resolve(storageRoot);
        fs.mkdirSync(dbDir, { recursive: true });
        const dbPath = path.join(dbDir, 'context-vault.db');
        this.logger.log(`Opening database at: ${dbPath}`);
        this._db = new BetterSqlite3(dbPath, { verbose: undefined });
        this._db.pragma('journal_mode=WAL');
        this._db.pragma('foreign_keys=ON');
        this._db.pragma('synchronous=NORMAL');
        this._db.pragma('cache_size=-64000');
        await this.runMigrations();
        this.logger.log('Database initialized successfully');
    }
    get db() {
        return this._db;
    }
    run(sql, params = []) {
        try {
            return this._db.prepare(sql).run(...params);
        }
        catch (err) {
            this.logger.error(`DB run error: ${err.message}\nSQL: ${sql}`);
            throw err;
        }
    }
    get(sql, params = []) {
        try {
            return this._db.prepare(sql).get(...params);
        }
        catch (err) {
            this.logger.error(`DB get error: ${err.message}\nSQL: ${sql}`);
            throw err;
        }
    }
    all(sql, params = []) {
        try {
            return this._db.prepare(sql).all(...params);
        }
        catch (err) {
            this.logger.error(`DB all error: ${err.message}\nSQL: ${sql}`);
            throw err;
        }
    }
    transaction(fn) {
        return this._db.transaction(fn)();
    }
    async runMigrations() {
        this._db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      )
    `);
        const migrationsDir = path.resolve(__dirname, '..', '..', '..', '..', 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            this.logger.warn(`Migrations directory not found: ${migrationsDir}`);
            return;
        }
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();
        for (const file of files) {
            const applied = this._db.prepare('SELECT id FROM _migrations WHERE filename = ?').get(file);
            if (!applied) {
                const sqlPath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(sqlPath, 'utf8');
                this.logger.log(`Running migration: ${file}`);
                this._db.exec(sql);
                this._db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
                this.logger.log(`Migration applied: ${file}`);
            }
        }
    }
    onModuleDestroy() {
        if (this._db && this._db.open) {
            this._db.close();
            this.logger.log('Database connection closed');
        }
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseService);
//# sourceMappingURL=database.service.js.map