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
var LlamaProxyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlamaProxyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let LlamaProxyService = LlamaProxyService_1 = class LlamaProxyService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(LlamaProxyService_1.name);
        this.llamaUrl = config.get('contextVault.llamaServerUrl', 'http://localhost:8080');
    }
    getLlamaUrl() {
        return this.llamaUrl;
    }
    async forward(method, path, headers, body) {
        const url = `${this.llamaUrl}${path}`;
        const forwardHeaders = {};
        for (const [k, v] of Object.entries(headers)) {
            const lower = k.toLowerCase();
            if (['content-type', 'accept', 'authorization', 'x-api-key'].includes(lower)) {
                forwardHeaders[k] = v;
            }
        }
        const init = {
            method,
            headers: forwardHeaders,
            signal: AbortSignal.timeout(120_000),
        };
        if (body && method !== 'GET' && method !== 'HEAD') {
            init.body = body;
        }
        return fetch(url, init);
    }
};
exports.LlamaProxyService = LlamaProxyService;
exports.LlamaProxyService = LlamaProxyService = LlamaProxyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LlamaProxyService);
//# sourceMappingURL=llama-proxy.service.js.map