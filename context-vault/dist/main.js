"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const express_1 = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['log', 'warn', 'error'],
        bodyParser: false,
    });
    app.use((0, express_1.json)({ limit: '10mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '10mb' }));
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization, X-Api-Key',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: false,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    await app.listen(port);
    const logger = new common_1.Logger('Bootstrap');
    logger.log(`ContextVault V1 running on: http://localhost:${port}`);
    logger.log(`API  →  http://localhost:${port}/api`);
    logger.log(`Proxy → http://localhost:${port}/v1/chat/completions`);
}
bootstrap().catch(err => {
    console.error('Failed to start ContextVault:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map