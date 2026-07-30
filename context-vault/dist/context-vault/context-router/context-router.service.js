"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ContextRouterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextRouterService = void 0;
const common_1 = require("@nestjs/common");
let ContextRouterService = ContextRouterService_1 = class ContextRouterService {
    constructor() {
        this.logger = new common_1.Logger(ContextRouterService_1.name);
    }
    analyzeQuery(chatId, query) {
        const lower = query.toLowerCase();
        const intent = this.detectIntent(lower);
        const project = this.detectProject(lower);
        return {
            chatId,
            query,
            intent,
            enableKeyword: true,
            enableSemantic: true,
            enableStructured: true,
            enableCapsule: intent === 'question' || lower.includes('summary') || lower.includes('context'),
            project,
            topK: 12,
        };
    }
    detectIntent(query) {
        if (query.includes('?') ||
            query.startsWith('what') ||
            query.startsWith('how') ||
            query.startsWith('why') ||
            query.startsWith('when') ||
            query.startsWith('where') ||
            query.startsWith('who') ||
            query.startsWith('is ') ||
            query.startsWith('are ') ||
            query.startsWith('can ')) {
            return 'question';
        }
        if (query.startsWith('do ') ||
            query.startsWith('create') ||
            query.startsWith('update') ||
            query.startsWith('delete') ||
            query.startsWith('run') ||
            query.startsWith('execute') ||
            query.startsWith('implement') ||
            query.startsWith('build') ||
            query.startsWith('fix') ||
            query.startsWith('add')) {
            return 'command';
        }
        return 'continuation';
    }
    detectProject(query) {
        const projectMatch = query.match(/project[:\s]+([a-z0-9_-]+)/i);
        return projectMatch?.[1];
    }
};
exports.ContextRouterService = ContextRouterService;
exports.ContextRouterService = ContextRouterService = ContextRouterService_1 = __decorate([
    (0, common_1.Injectable)()
], ContextRouterService);
//# sourceMappingURL=context-router.service.js.map