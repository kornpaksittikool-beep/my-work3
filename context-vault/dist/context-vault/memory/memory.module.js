"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryModule = void 0;
const common_1 = require("@nestjs/common");
const memory_service_1 = require("./memory.service");
const memory_controller_1 = require("./memory.controller");
const memory_repository_1 = require("./memory.repository");
const memory_extractor_service_1 = require("./memory-extractor.service");
let MemoryModule = class MemoryModule {
};
exports.MemoryModule = MemoryModule;
exports.MemoryModule = MemoryModule = __decorate([
    (0, common_1.Module)({
        providers: [memory_service_1.MemoryService, memory_repository_1.MemoryRepository, memory_extractor_service_1.MemoryExtractorService],
        controllers: [memory_controller_1.MemoryController],
        exports: [memory_service_1.MemoryService, memory_repository_1.MemoryRepository, memory_extractor_service_1.MemoryExtractorService],
    })
], MemoryModule);
//# sourceMappingURL=memory.module.js.map