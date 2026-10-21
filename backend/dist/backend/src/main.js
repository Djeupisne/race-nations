"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const helmet_1 = __importDefault(require("helmet"));
const express_1 = require("express");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
    });
    const config = app.get(config_1.ConfigService);
    const port = config.get('port') ?? 3000;
    const env = config.get('env') ?? 'development';
    app.use((0, express_1.json)({
        limit: '1mb',
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '1mb' }));
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: config.get('corsOrigins') ?? [],
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true,
        maxAge: 86_400,
    });
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: common_1.VersioningType.URI, defaultVersion: '1' });
    app.enableShutdownHooks();
    await app.listen(port, '0.0.0.0');
    logger.log(`Race Nations API ${env} démarré sur :${port} (/api/v1)`);
}
bootstrap().catch((err) => {
    console.error('FATAL bootstrap', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map