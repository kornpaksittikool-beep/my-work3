import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as BetterSqlite3 from 'better-sqlite3';
export declare class DatabaseService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private _db;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    get db(): BetterSqlite3.Database;
    run(sql: string, params?: any[]): BetterSqlite3.RunResult;
    get<T>(sql: string, params?: any[]): T | undefined;
    all<T>(sql: string, params?: any[]): T[];
    transaction<T>(fn: () => T): T;
    private runMigrations;
    onModuleDestroy(): void;
}
