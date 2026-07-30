import { DatabaseService } from '../shared/database/database.service';
import { EpochRow } from '../shared/database/database.types';
export declare class EpochRepository {
    private readonly db;
    constructor(db: DatabaseService);
    create(chatId: string, sequence: number, tokenStart?: number): EpochRow;
    getById(id: string): EpochRow | undefined;
    getActiveByChatId(chatId: string): EpochRow | undefined;
    listByChatId(chatId: string): EpochRow[];
    close(id: string, tokenEnd: number): void;
    setCapsule(epochId: string, capsuleId: string): void;
    getLatestSequence(chatId: string): number;
}
