export declare enum ChatStatus {
    ACTIVE = "ACTIVE",
    ARCHIVED = "ARCHIVED",
    DELETED = "DELETED"
}
export declare enum EpochState {
    OPEN = "OPEN",
    CLOSED = "CLOSED"
}
export declare enum MessageRole {
    USER = "user",
    ASSISTANT = "assistant",
    SYSTEM = "system",
    TOOL = "tool"
}
export declare enum MessageStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum MemoryType {
    FACT = "FACT",
    DECISION = "DECISION",
    RULE = "RULE",
    TASK = "TASK",
    PROJECT_STATE = "PROJECT_STATE",
    OPEN_QUESTION = "OPEN_QUESTION",
    EVIDENCE = "EVIDENCE",
    REJECTION = "REJECTION"
}
export declare enum MemoryStatus {
    ACTIVE = "ACTIVE",
    SUPERSEDED = "SUPERSEDED",
    REJECTED = "REJECTED",
    EXPIRED = "EXPIRED"
}
export declare enum TaskStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    DONE = "DONE",
    BLOCKED = "BLOCKED"
}
export declare enum CapsuleType {
    CHUNK = "CHUNK",
    TOPIC = "TOPIC",
    SESSION = "SESSION",
    FINAL = "FINAL"
}
export declare enum RetrievalType {
    KEYWORD = "keyword",
    SEMANTIC = "semantic",
    STRUCTURED = "structured",
    CAPSULE = "capsule",
    RECENT_TAIL = "recent_tail"
}
export declare enum RolloverState {
    NORMAL = "NORMAL",
    PREPARE = "PREPARE",
    ROLLOVER = "ROLLOVER",
    EMERGENCY = "EMERGENCY"
}
export interface ModelProfile {
    id: string;
    name: string;
    context_size: number;
    tokenizer_id?: string;
    chat_template?: string;
    kv_format: string;
    llama_server_url: string;
    created_at: string;
}
export interface Chat {
    id: string;
    title: string;
    model_profile_id: string;
    total_tokens: number;
    active_epoch_id?: string;
    status: ChatStatus;
    created_at: string;
    updated_at: string;
}
export interface Epoch {
    id: string;
    chat_id: string;
    sequence: number;
    token_start: number;
    token_end?: number;
    state: EpochState;
    capsule_id?: string;
    created_at: string;
    closed_at?: string;
}
export interface Message {
    id: string;
    chat_id: string;
    epoch_id: string;
    role: MessageRole;
    content: string;
    token_start?: number;
    token_end?: number;
    token_count?: number;
    importance: number;
    status: MessageStatus;
    embedding_id?: string;
    created_at: string;
}
export interface MemoryItem {
    id: string;
    chat_id: string;
    type: MemoryType;
    project?: string;
    content: string;
    confidence: number;
    status: MemoryStatus;
    source_message_ids: string[];
    rejected_alternatives?: string[];
    task_status?: TaskStatus;
    task_assignee?: string;
    task_dependencies?: string[];
    next_action?: string;
    expires_at?: string;
    created_at: string;
    last_verified_at: string;
    updated_at: string;
}
export interface Capsule {
    id: string;
    chat_id: string;
    epoch_id?: string;
    type: CapsuleType;
    summary: string;
    open_tasks: string[];
    constraints: string[];
    source_message_ids: string[];
    token_start?: number;
    token_end?: number;
    token_count?: number;
    embedding_id?: string;
    created_at: string;
}
export interface RetrievalEvent {
    id: string;
    chat_id: string;
    message_id?: string;
    query: string;
    retrieval_type: RetrievalType;
    candidates: RetrievalCandidate[];
    selected: SelectedItem[];
    total_tokens_retrieved?: number;
    latency_ms?: number;
    created_at: string;
}
export interface RetrievalCandidate {
    id: string;
    score: number;
    content_preview: string;
    token_count?: number;
    source_type?: 'message' | 'memory' | 'capsule';
}
export interface SelectedItem {
    id: string;
    score: number;
    slot: string;
}
export interface ScoredCandidate extends RetrievalCandidate {
    semantic_score: number;
    keyword_score: number;
    recency_score: number;
    importance_score: number;
    source_confidence: number;
    project_match: number;
    final_score: number;
    content: string;
}
export interface RetrievalPlan {
    chatId: string;
    query: string;
    intent: 'question' | 'command' | 'continuation';
    enableKeyword: boolean;
    enableSemantic: boolean;
    enableStructured: boolean;
    enableCapsule: boolean;
    project?: string;
    topK: number;
}
export interface BudgetBreakdown {
    systemPrompt: number;
    permanentRules: number;
    recentConversation: number;
    retrievedEvidence: number;
    workingSummary: number;
    reservedOutput: number;
    emergencyReserve: number;
    available: number;
    totalUsed: number;
    modelContextSize: number;
    usagePercent: number;
    rolloverState: RolloverState;
}
export interface ContextSlot {
    name: string;
    content: string;
    tokenCount: number;
    sourceIds: string[];
}
export interface ActiveContext {
    slots: ContextSlot[];
    totalTokens: number;
    sourceIds: string[];
    budgetBreakdown: BudgetBreakdown;
    retrievalCandidates?: RetrievalCandidate[];
    selectedItems?: SelectedItem[];
}
export interface CreateChatDto {
    title: string;
    modelProfileId: string;
}
export interface CreateModelProfileDto {
    name: string;
    context_size: number;
    tokenizer_id?: string;
    chat_template?: string;
    kv_format?: string;
    llama_server_url?: string;
}
export interface SendMessageDto {
    content: string;
    role?: MessageRole;
}
export interface UpdateMemoryDto {
    status?: MemoryStatus;
    content?: string;
    confidence?: number;
    task_status?: TaskStatus;
    next_action?: string;
}
export interface ContextPreviewResponse {
    budgetBreakdown: BudgetBreakdown;
    candidateCount: number;
    selectedSources: string[];
    estimatedTokens: number;
}
export interface SseTokenEvent {
    type: 'token';
    content: string;
}
export interface SseContextEvent {
    type: 'context';
    tokenCount: number;
    sources: string[];
}
export interface SseDoneEvent {
    type: 'done';
    messageId: string;
    tokensUsed: number;
}
export interface SseErrorEvent {
    type: 'error';
    message: string;
}
export type SseEvent = SseTokenEvent | SseContextEvent | SseDoneEvent | SseErrorEvent;
