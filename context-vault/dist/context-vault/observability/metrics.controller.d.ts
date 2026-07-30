import { ObservabilityService } from './observability.service';
export declare class MetricsController {
    private readonly observabilityService;
    private readonly logger;
    constructor(observabilityService: ObservabilityService);
    getMetrics(): Promise<object>;
}
