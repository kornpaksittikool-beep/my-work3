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
var TokenizerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenizerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
let TokenizerService = TokenizerService_1 = class TokenizerService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(TokenizerService_1.name);
        this.cache = new Map();
        this.maxCacheSize = 1000;
        this.llamaServerUrl = this.configService.get('contextVault.llamaServerUrl', 'http://localhost:8080');
    }
    async countTokens(text, _modelProfileId) {
        if (!text)
            return 0;
        const hash = crypto.createHash('md5').update(text).digest('hex');
        const cached = this.cache.get(hash);
        if (cached) {
            cached.accessTime = Date.now();
            return cached.count;
        }
        try {
            const response = await fetch(`${this.llamaServerUrl}/tokenize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text, add_special: false }),
                signal: AbortSignal.timeout(3000),
            });
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const count = data.tokens?.length ?? this.fallbackCount(text);
            this.cacheSet(hash, count);
            return count;
        }
        catch (_err) {
            const count = this.fallbackCount(text);
            this.cacheSet(hash, count);
            return count;
        }
    }
    async countTokensBatch(texts) {
        return Promise.all(texts.map(t => this.countTokens(t)));
    }
    fallbackCount(text) {
        return Math.ceil(text.length / 4);
    }
    cacheSet(key, count) {
        if (this.cache.size >= this.maxCacheSize) {
            let oldestKey = null;
            let oldestTime = Infinity;
            for (const [k, v] of this.cache) {
                if (v.accessTime < oldestTime) {
                    oldestTime = v.accessTime;
                    oldestKey = k;
                }
            }
            if (oldestKey)
                this.cache.delete(oldestKey);
        }
        this.cache.set(key, { count, accessTime: Date.now() });
    }
};
exports.TokenizerService = TokenizerService;
exports.TokenizerService = TokenizerService = TokenizerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TokenizerService);
//# sourceMappingURL=tokenizer.service.js.map