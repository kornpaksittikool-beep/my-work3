"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingModule = void 0;
const common_1 = require("@nestjs/common");
const indexing_service_1 = require("./indexing.service");
const embeddings_module_1 = require("../embeddings/embeddings.module");
const message_store_module_1 = require("../message-store/message-store.module");
const capsule_repository_1 = require("../capsule/capsule.repository");
let IndexingModule = class IndexingModule {
};
exports.IndexingModule = IndexingModule;
exports.IndexingModule = IndexingModule = __decorate([
    (0, common_1.Module)({
        imports: [embeddings_module_1.EmbeddingsModule, message_store_module_1.MessageStoreModule],
        providers: [indexing_service_1.IndexingService, capsule_repository_1.CapsuleRepository],
        exports: [indexing_service_1.IndexingService],
    })
], IndexingModule);
//# sourceMappingURL=indexing.module.js.map