"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolloverState = exports.RetrievalType = exports.CapsuleType = exports.TaskStatus = exports.MemoryStatus = exports.MemoryType = exports.MessageStatus = exports.MessageRole = exports.EpochState = exports.ChatStatus = void 0;
var ChatStatus;
(function (ChatStatus) {
    ChatStatus["ACTIVE"] = "ACTIVE";
    ChatStatus["ARCHIVED"] = "ARCHIVED";
    ChatStatus["DELETED"] = "DELETED";
})(ChatStatus || (exports.ChatStatus = ChatStatus = {}));
var EpochState;
(function (EpochState) {
    EpochState["OPEN"] = "OPEN";
    EpochState["CLOSED"] = "CLOSED";
})(EpochState || (exports.EpochState = EpochState = {}));
var MessageRole;
(function (MessageRole) {
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
    MessageRole["SYSTEM"] = "system";
    MessageRole["TOOL"] = "tool";
})(MessageRole || (exports.MessageRole = MessageRole = {}));
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["PENDING"] = "PENDING";
    MessageStatus["COMPLETED"] = "COMPLETED";
    MessageStatus["FAILED"] = "FAILED";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
var MemoryType;
(function (MemoryType) {
    MemoryType["FACT"] = "FACT";
    MemoryType["DECISION"] = "DECISION";
    MemoryType["RULE"] = "RULE";
    MemoryType["TASK"] = "TASK";
    MemoryType["PROJECT_STATE"] = "PROJECT_STATE";
    MemoryType["OPEN_QUESTION"] = "OPEN_QUESTION";
    MemoryType["EVIDENCE"] = "EVIDENCE";
    MemoryType["REJECTION"] = "REJECTION";
})(MemoryType || (exports.MemoryType = MemoryType = {}));
var MemoryStatus;
(function (MemoryStatus) {
    MemoryStatus["ACTIVE"] = "ACTIVE";
    MemoryStatus["SUPERSEDED"] = "SUPERSEDED";
    MemoryStatus["REJECTED"] = "REJECTED";
    MemoryStatus["EXPIRED"] = "EXPIRED";
})(MemoryStatus || (exports.MemoryStatus = MemoryStatus = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "PENDING";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["DONE"] = "DONE";
    TaskStatus["BLOCKED"] = "BLOCKED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var CapsuleType;
(function (CapsuleType) {
    CapsuleType["CHUNK"] = "CHUNK";
    CapsuleType["TOPIC"] = "TOPIC";
    CapsuleType["SESSION"] = "SESSION";
    CapsuleType["FINAL"] = "FINAL";
})(CapsuleType || (exports.CapsuleType = CapsuleType = {}));
var RetrievalType;
(function (RetrievalType) {
    RetrievalType["KEYWORD"] = "keyword";
    RetrievalType["SEMANTIC"] = "semantic";
    RetrievalType["STRUCTURED"] = "structured";
    RetrievalType["CAPSULE"] = "capsule";
    RetrievalType["RECENT_TAIL"] = "recent_tail";
})(RetrievalType || (exports.RetrievalType = RetrievalType = {}));
var RolloverState;
(function (RolloverState) {
    RolloverState["NORMAL"] = "NORMAL";
    RolloverState["PREPARE"] = "PREPARE";
    RolloverState["ROLLOVER"] = "ROLLOVER";
    RolloverState["EMERGENCY"] = "EMERGENCY";
})(RolloverState || (exports.RolloverState = RolloverState = {}));
//# sourceMappingURL=index.js.map