import { EpochRepository } from './epoch.repository';
import { EpochRow } from '../shared/database/database.types';
export declare class EpochService {
    private readonly epochRepo;
    private readonly logger;
    constructor(epochRepo: EpochRepository);
    createEpoch(chatId: string, tokenStart?: number): Promise<EpochRow>;
    getActiveEpoch(chatId: string): Promise<EpochRow | undefined>;
    getEpochById(id: string): Promise<EpochRow | undefined>;
    listEpochs(chatId: string): Promise<EpochRow[]>;
    closeEpoch(epochId: string, tokenEnd: number): Promise<void>;
    setCapsule(epochId: string, capsuleId: string): Promise<void>;
}
