"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapsuleModule = void 0;
const common_1 = require("@nestjs/common");
const capsule_service_1 = require("./capsule.service");
const capsule_repository_1 = require("./capsule.repository");
const message_store_module_1 = require("../message-store/message-store.module");
const memory_module_1 = require("../memory/memory.module");
const indexing_module_1 = require("../indexing/indexing.module");
const embeddings_module_1 = require("../embeddings/embeddings.module");
const tokenizer_module_1 = require("../shared/tokenizer/tokenizer.module");
let CapsuleModule = class CapsuleModule {
};
exports.CapsuleModule = CapsuleModule;
exports.CapsuleModule = CapsuleModule = __decorate([
    (0, common_1.Module)({
        imports: [message_store_module_1.MessageStoreModule, memory_module_1.MemoryModule, indexing_module_1.IndexingModule, embeddings_module_1.EmbeddingsModule, tokenizer_module_1.TokenizerModule],
        providers: [capsule_service_1.CapsuleService, capsule_repository_1.CapsuleRepository],
        exports: [capsule_service_1.CapsuleService, capsule_repository_1.CapsuleRepository],
    })
], CapsuleModule);
//# sourceMappingURL=capsule.module.js.map