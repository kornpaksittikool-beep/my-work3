export interface ModelProfileRow {
    id: string;
    name: string;
    context_size: number;
    tokenizer_id: string | null;
    chat_template: string | null;
    kv_format: string;
    llama_server_url: string;
    created_at: string;
}
export interface ChatRow {
    id: string;
    title: string;
    model_profile_id: string;
    total_tokens: number;
    active_epoch_id: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}
export interface EpochRow {
    id: string;
    chat_id: string;
    sequence: number;
    token_start: number;
    token_end: number | null;
    state: string;
    capsule_id: string | null;
    created_at: string;
    closed_at: string | null;
}
export interface MessageRow {
    id: string;
    chat_id: string;
    epoch_id: string;
    role: string;
    content: string;
    token_start: number | null;
    token_end: number | null;
    token_count: number | null;
    importance: number;
    status: string;
    embedding_id: string | null;
    created_at: string;
}
export interface MemoryItemRow {
    id: string;
    chat_id: string;
    type: string;
    project: string | null;
    content: string;
    confidence: number;
    status: string;
    source_message_ids: string;
    rejected_alternatives: string | null;
    task_status: string | null;
    task_assignee: string | null;
    task_dependencies: string | null;
    next_action: string | null;
    expires_at: string | null;
    created_at: string;
    last_verified_at: string;
    updated_at: string;
}
export interface CapsuleRow {
    id: string;
    chat_id: string;
    epoch_id: string | null;
    type: string;
    summary: string;
    open_tasks: string;
    constraints: string;
    source_message_ids: string;
    token_start: number | null;
    token_end: number | null;
    token_count: number | null;
    embedding_id: string | null;
    created_at: string;
}
export interface RetrievalEventRow {
    id: string;
    chat_id: string;
    message_id: string | null;
    query: string;
    retrieval_type: string;
    candidates: string;
    selected: string;
    total_tokens_retrieved: number | null;
    latency_ms: number | null;
    created_at: string;
}
export interface KvSegmentRow {
    id: string;
    chat_id: string;
    epoch_id: string | null;
    file_path: string;
    byte_offset: number;
    byte_length: number;
    token_start: number;
    token_end: number;
    model_signature: string;
    checksum: string;
    state: string;
    created_at: string;
}
export interface MigrationRow {
    id: number;
    filename: string;
    applied_at: string;
}
