"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('contextVault', () => ({
    port: parseInt(process.env.PORT || '3001', 10),
    llamaServerUrl: process.env.LLAMA_SERVER_URL || 'http://localhost:8080',
    storageRoot: process.env.CV_STORAGE_ROOT || './data/context-vault',
    maxStorageGb: parseInt(process.env.CV_MAX_STORAGE_GB || '100', 10),
    modelContextSize: parseInt(process.env.CV_MODEL_CONTEXT_SIZE || '32768', 10),
    reservedOutputTokens: parseInt(process.env.CV_RESERVED_OUTPUT_TOKENS || '6144', 10),
    emergencyReserveTokens: parseInt(process.env.CV_EMERGENCY_RESERVE_TOKENS || '1024', 10),
    rolloverHighWatermark: parseFloat(process.env.CV_ROLLOVER_HIGH_WATERMARK || '0.82'),
    recentTailTokens: parseInt(process.env.CV_RECENT_TAIL_TOKENS || '4096', 10),
    logicalTokenLimit: parseInt(process.env.CV_LOGICAL_TOKEN_LIMIT || '500000', 10),
    keywordTopK: parseInt(process.env.CV_KEYWORD_TOP_K || '30', 10),
    semanticTopK: parseInt(process.env.CV_SEMANTIC_TOP_K || '30', 10),
    rerankTopK: parseInt(process.env.CV_RERANK_TOP_K || '12', 10),
    minScore: parseFloat(process.env.CV_MIN_SCORE || '0.25'),
    maxRetrievedTokens: parseInt(process.env.CV_MAX_RETRIEVED_TOKENS || '12000', 10),
    chunkIntervalTokens: parseInt(process.env.CV_CHUNK_INTERVAL_TOKENS || '12000', 10),
    topicIntervalTokens: parseInt(process.env.CV_TOPIC_INTERVAL_TOKENS || '48000', 10),
    sessionIntervalTokens: parseInt(process.env.CV_SESSION_INTERVAL_TOKENS || '150000', 10),
    embeddingDimension: parseInt(process.env.CV_EMBEDDING_DIMENSION || '768', 10),
}));
//# sourceMappingURL=configuration.js.map