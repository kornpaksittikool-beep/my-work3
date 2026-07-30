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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProxyController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyController = void 0;
const common_1 = require("@nestjs/common");
const llama_proxy_service_1 = require("./llama-proxy.service");
const chat_completions_interceptor_service_1 = require("./chat-completions-interceptor.service");
let ProxyController = ProxyController_1 = class ProxyController {
    constructor(llamaProxy, interceptor) {
        this.llamaProxy = llamaProxy;
        this.interceptor = interceptor;
        this.logger = new common_1.Logger(ProxyController_1.name);
    }
    buildForwardHeaders(req) {
        const headers = {};
        for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === 'string')
                headers[k] = v;
        }
        return headers;
    }
    async chatCompletions(req, res) {
        await this.interceptor.intercept(req.body, this.buildForwardHeaders(req), res);
    }
    async passThrough(req, res) {
        if (req.method === 'POST' && req.path === '/v1/chat/completions') {
            await this.interceptor.intercept(req.body, this.buildForwardHeaders(req), res);
            return;
        }
        const method = req.method;
        const fullPath = req.originalUrl;
        const headers = this.buildForwardHeaders(req);
        let bodyStr;
        if (method !== 'GET' && method !== 'HEAD' && req.body) {
            bodyStr =
                typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }
        try {
            const upstream = await this.llamaProxy.forward(method, fullPath, headers, bodyStr);
            res.status(upstream.status);
            upstream.headers.forEach((value, key) => {
                const lower = key.toLowerCase();
                if (!['transfer-encoding', 'connection', 'keep-alive'].includes(lower)) {
                    res.setHeader(key, value);
                }
            });
            const contentType = upstream.headers.get('content-type') ?? '';
            if ((contentType.includes('text/event-stream') ||
                contentType.includes('application/octet-stream')) &&
                upstream.body) {
                if (typeof res.flushHeaders === 'function') {
                    res.flushHeaders();
                }
                const reader = upstream.body.getReader();
                const decoder = new TextDecoder();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    res.write(decoder.decode(value, { stream: true }));
                }
                res.end();
            }
            else {
                const buffer = await upstream.arrayBuffer();
                res.end(Buffer.from(buffer));
            }
        }
        catch (err) {
            this.logger.error(`Proxy ${method} ${fullPath}: ${err.message}`);
            if (!res.headersSent) {
                res.status(502).json({ error: 'proxy_error', message: err.message });
            }
        }
    }
};
exports.ProxyController = ProxyController;
__decorate([
    (0, common_1.Post)('v1/chat/completions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "chatCompletions", null);
__decorate([
    (0, common_1.All)([
        'v1/*',
        'props',
        'models',
        'models/*',
        'tools',
        'tools/*',
        'slots',
        'slots/*',
        'cors-proxy',
        'cors-proxy/*',
    ]),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "passThrough", null);
exports.ProxyController = ProxyController = ProxyController_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [llama_proxy_service_1.LlamaProxyService,
        chat_completions_interceptor_service_1.ChatCompletionsInterceptorService])
], ProxyController);
//# sourceMappingURL=proxy.controller.js.map