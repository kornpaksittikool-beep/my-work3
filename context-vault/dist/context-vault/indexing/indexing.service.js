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
var IndexingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const embeddings_service_1 = require("../embeddings/embeddings.service");
const message_repository_1 = require("../message-store/message.repository");
const capsule_repository_1 = require("../capsule/capsule.repository");
const path = require("path");
const fs = require("fs");
let IndexingService = IndexingService_1 = class IndexingService {
    constructor(configService, embeddingsService, messageRepo, capsuleRepo) {
        this.configService = configService;
        this.embeddingsService = embeddingsService;
        this.messageRepo = messageRepo;
        this.capsuleRepo = capsuleRepo;
        this.logger = new common_1.Logger(IndexingService_1.name);
        this.messagesIndex = null;
        this.capsulesIndex = null;
        this.messagesMap = { idToLabel: new Map(), labelToId: new Map(), nextLabel: 0 };
        this.capsulesMap = { idToLabel: new Map(), labelToId: new Map(), nextLabel: 0 };
        this.HnswLib = null;
        this.storageRoot = path.resolve(this.configService.get('contextVault.storageRoot', './data/context-vault'));
        this.dimension = this.configService.get('contextVault.embeddingDimension', 768);
        this.indexDir = path.join(this.storageRoot, 'vector-index');
    }
    async onModuleInit() {
        fs.mkdirSync(this.indexDir, { recursive: true });
        try {
            this.HnswLib = await Promise.resolve().then(() => require('hnswlib-node'));
            await this.loadIndexes();
        }
        catch (err) {
            this.logger.warn(`HNSW initialization failed, semantic search disabled: ${err.message}`);
        }
    }
    createNewIndex() {
        if (!this.HnswLib)
            return null;
        try {
            const index = new this.HnswLib.HierarchicalNSW('cosine', this.dimension);
            index.initIndex(10000, 200, 16);
            return index;
        }
        catch (err) {
            this.logger.warn(`Failed to create HNSW index: ${err.message}`);
            return null;
        }
    }
    async loadIndexes() {
        const messagesPath = path.join(this.indexDir, 'messages.hnsw');
        const capsulesPath = path.join(this.indexDir, 'capsules.hnsw');
        const messagesMapPath = path.join(this.indexDir, 'messages.map.json');
        const capsulesMapPath = path.join(this.indexDir, 'capsules.map.json');
        if (fs.existsSync(messagesPath) && fs.existsSync(messagesMapPath)) {
            try {
                const mapData = JSON.parse(fs.readFileSync(messagesMapPath, 'utf8'));
                this.messagesMap = {
                    idToLabel: new Map(mapData.idToLabel),
                    labelToId: new Map(mapData.labelToId.map(([k, v]) => [parseInt(k), v])),
                    nextLabel: mapData.nextLabel,
                };
                this.messagesIndex = this.createNewIndex();
                if (this.messagesIndex) {
                    this.messagesIndex.loadIndex(messagesPath, Math.max(10000, this.messagesMap.nextLabel + 1000));
                    this.logger.log(`Loaded messages HNSW index (${this.messagesMap.nextLabel} vectors)`);
                }
            }
            catch (err) {
                this.logger.warn(`Failed to load messages index, starting fresh: ${err.message}`);
                this.messagesIndex = this.createNewIndex();
                this.messagesMap = { idToLabel: new Map(), labelToId: new Map(), nextLabel: 0 };
            }
        }
        else {
            this.messagesIndex = this.createNewIndex();
        }
        if (fs.existsSync(capsulesPath) && fs.existsSync(capsulesMapPath)) {
            try {
                const mapData = JSON.parse(fs.readFileSync(capsulesMapPath, 'utf8'));
                this.capsulesMap = {
                    idToLabel: new Map(mapData.idToLabel),
                    labelToId: new Map(mapData.labelToId.map(([k, v]) => [parseInt(k), v])),
                    nextLabel: mapData.nextLabel,
                };
                this.capsulesIndex = this.createNewIndex();
                if (this.capsulesIndex) {
                    this.capsulesIndex.loadIndex(capsulesPath, Math.max(1000, this.capsulesMap.nextLabel + 100));
                    this.logger.log(`Loaded capsules HNSW index (${this.capsulesMap.nextLabel} vectors)`);
                }
            }
            catch (err) {
                this.logger.warn(`Failed to load capsules index, starting fresh: ${err.message}`);
                this.capsulesIndex = this.createNewIndex();
                this.capsulesMap = { idToLabel: new Map(), labelToId: new Map(), nextLabel: 0 };
            }
        }
        else {
            this.capsulesIndex = this.createNewIndex();
        }
    }
    saveIndexes() {
        if (!this.messagesIndex && !this.capsulesIndex)
            return;
        try {
            if (this.messagesIndex && this.messagesMap.nextLabel > 0) {
                this.messagesIndex.saveIndex(path.join(this.indexDir, 'messages.hnsw'));
                this.saveMap(this.messagesMap, path.join(this.indexDir, 'messages.map.json'));
            }
            if (this.capsulesIndex && this.capsulesMap.nextLabel > 0) {
                this.capsulesIndex.saveIndex(path.join(this.indexDir, 'capsules.hnsw'));
                this.saveMap(this.capsulesMap, path.join(this.indexDir, 'capsules.map.json'));
            }
        }
        catch (err) {
            this.logger.error(`Failed to save HNSW indexes: ${err.message}`);
        }
    }
    saveMap(map, filePath) {
        const data = {
            idToLabel: Array.from(map.idToLabel.entries()),
            labelToId: Array.from(map.labelToId.entries()),
            nextLabel: map.nextLabel,
        };
        fs.writeFileSync(filePath, JSON.stringify(data));
    }
    addMessage(id, embedding) {
        if (!this.messagesIndex || !embedding.length)
            return;
        try {
            if (this.messagesMap.idToLabel.has(id))
                return;
            const label = this.messagesMap.nextLabel++;
            if (label >= this.messagesIndex.getCurrentCount() + 1000) {
                this.messagesIndex.resizeIndex(label + 2000);
            }
            this.messagesIndex.addPoint(embedding, label);
            this.messagesMap.idToLabel.set(id, label);
            this.messagesMap.labelToId.set(label, id);
        }
        catch (err) {
            this.logger.warn(`Failed to add message to HNSW: ${err.message}`);
        }
    }
    searchMessages(embedding, k) {
        if (!this.messagesIndex || !embedding.length || this.messagesMap.nextLabel === 0)
            return [];
        try {
            const actualK = Math.min(k, this.messagesMap.nextLabel);
            const result = this.messagesIndex.searchKnn(embedding, actualK);
            return result.neighbors.map((label, i) => ({
                id: this.messagesMap.labelToId.get(label) ?? '',
                score: 1 - result.distances[i],
            })).filter(r => r.id !== '');
        }
        catch (err) {
            this.logger.warn(`HNSW search failed: ${err.message}`);
            return [];
        }
    }
    addCapsule(id, embedding) {
        if (!this.capsulesIndex || !embedding.length)
            return;
        try {
            if (this.capsulesMap.idToLabel.has(id))
                return;
            const label = this.capsulesMap.nextLabel++;
            this.capsulesIndex.addPoint(embedding, label);
            this.capsulesMap.idToLabel.set(id, label);
            this.capsulesMap.labelToId.set(label, id);
        }
        catch (err) {
            this.logger.warn(`Failed to add capsule to HNSW: ${err.message}`);
        }
    }
    searchCapsules(embedding, k) {
        if (!this.capsulesIndex || !embedding.length || this.capsulesMap.nextLabel === 0)
            return [];
        try {
            const actualK = Math.min(k, this.capsulesMap.nextLabel);
            const result = this.capsulesIndex.searchKnn(embedding, actualK);
            return result.neighbors.map((label, i) => ({
                id: this.capsulesMap.labelToId.get(label) ?? '',
                score: 1 - result.distances[i],
            })).filter(r => r.id !== '');
        }
        catch (err) {
            this.logger.warn(`HNSW capsule search failed: ${err.message}`);
            return [];
        }
    }
    async rebuild(chatId) {
        this.logger.log(`Rebuilding HNSW indexes${chatId ? ` for chat ${chatId}` : ''}`);
        this.messagesIndex = this.createNewIndex();
        this.messagesMap = { idToLabel: new Map(), labelToId: new Map(), nextLabel: 0 };
        this.capsulesIndex = this.createNewIndex();
        this.capsulesMap = { idToLabel: new Map(), labelToId: new Map(), nextLabel: 0 };
        const messages = this.messageRepo.getAllWithEmbedding(chatId);
        let processed = 0;
        for (const msg of messages) {
            if (!msg.content)
                continue;
            const embedding = await this.embeddingsService.embed(msg.content);
            if (embedding.length) {
                this.addMessage(msg.id, embedding);
                this.messageRepo.updateEmbeddingId(msg.id, msg.id);
                processed++;
            }
        }
        const capsules = chatId
            ? this.capsuleRepo.getByChatId(chatId)
            : this.capsuleRepo.getAll();
        for (const cap of capsules) {
            const embedding = await this.embeddingsService.embed(cap.summary);
            if (embedding.length) {
                this.addCapsule(cap.id, embedding);
            }
        }
        this.saveIndexes();
        this.logger.log(`Rebuilt HNSW: ${processed} messages, ${capsules.length} capsules`);
    }
};
exports.IndexingService = IndexingService;
exports.IndexingService = IndexingService = IndexingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        embeddings_service_1.EmbeddingsService,
        message_repository_1.MessageRepository,
        capsule_repository_1.CapsuleRepository])
], IndexingService);
//# sourceMappingURL=indexing.service.js.map