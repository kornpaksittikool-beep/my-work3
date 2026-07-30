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
var IndexController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexController = void 0;
const common_1 = require("@nestjs/common");
const indexing_service_1 = require("../indexing/indexing.service");
let IndexController = IndexController_1 = class IndexController {
    constructor(indexingService) {
        this.indexingService = indexingService;
        this.logger = new common_1.Logger(IndexController_1.name);
    }
    async rebuild(chatId) {
        this.logger.log(`Index rebuild requested${chatId ? ` for chat ${chatId}` : ' (all)'}`);
        await this.indexingService.rebuild(chatId);
        return { message: 'Index rebuilt successfully', chatId: chatId || 'all' };
    }
};
exports.IndexController = IndexController;
__decorate([
    (0, common_1.Post)('rebuild'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Query)('chatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IndexController.prototype, "rebuild", null);
exports.IndexController = IndexController = IndexController_1 = __decorate([
    (0, common_1.Controller)('api/index'),
    __metadata("design:paramtypes", [indexing_service_1.IndexingService])
], IndexController);
//# sourceMappingURL=index.controller.js.map