# ContextVault — Tiered Active Context System

**แผนงานพัฒนาระบบความจำระยะยาวสำหรับ Local AI**

> Remember everything. Activate only what matters.

เอกสารเวอร์ชัน 1.0 — 29 กรกฎาคม 2026

---

# 1. บทสรุปผู้บริหาร

ContextVault คือระบบจัดการความจำแบบหลายชั้นสำหรับ Local AI โดยมีเป้าหมายให้หนึ่งแชทเก็บข้อมูลเชิงตรรกะได้สูงสุด **500,000 tokens** แต่ส่งเฉพาะ Working Context ที่จำเป็นให้โมเดลในแต่ละรอบการตอบ ระบบไม่พยายามยัด KV cache ทั้งหมดลง VRAM และไม่อ้างว่าโมเดลมองเห็น 500K tokens พร้อมกันจริง

> เก็บข้อความทั้งหมดเป็นความจริง ค้นเฉพาะส่วนที่เกี่ยวข้อง และใช้ KV cache เป็นตัวเร่งความเร็วที่สร้างใหม่ได้

โครงการแบ่งเป็น 3 เวอร์ชันตามระดับความยากและความเสี่ยง เพื่อให้สร้างระบบที่ใช้งานได้จริงก่อน แล้วค่อยเพิ่มความเร็วและเทคนิค Attention ขั้นสูงภายหลัง

| เวอร์ชัน | ชื่อ | เป้าหมายหลัก | ระดับงาน |
| --- | --- | --- | --- |
| V1 | Semantic Memory | จำแชทยาวด้วยข้อความ, Summary, Capsule และ Retrieval | Application Engineering |
| V2 | Persistent KV | บันทึกและกู้คืน KV ที่ใช้ซ้ำได้อย่างปลอดภัยจาก RAM/SSD | Inference Integration |
| V3 | Selective Attention | เลือก KV ตาม Attention ระหว่าง inference และลด KV working set | AI Systems Research |

> **ข้อเสนอแนะ:** เริ่มพัฒนา V1 ให้ความแม่นยำด้านความจำและการอ้างอิงข้อความต้นฉบับผ่านเกณฑ์ก่อนเริ่ม V2 ส่วน V3 ควรเป็นสายทดลองแยกจาก production branch

## 1.1 เป้าหมายผลิตภัณฑ์

- ผู้ใช้คุยต่อเนื่องได้แม้ประวัติรวมเกิน context window ของโมเดล
- รักษา **กฎ การตัดสินใจ งานค้าง และสถานะโครงการ** ได้ดีกว่าการตัดข้อความเก่าแบบ FIFO
- ค้นย้อนกลับไปยังข้อความต้นฉบับได้ เพื่อป้องกัน Summary เพี้ยนหรือจำผิด
- ใช้ VRAM ตาม Active Working Context ไม่ใช่ขนาดประวัติแชททั้งหมด
- รองรับการเปิดแชทเดิมและคุยต่อโดยไม่ต้อง prefill ประวัติทั้งหมดซ้ำเมื่อ V2 พร้อม
- ทำงานแบบ Local-first และสามารถลบหรือสร้าง KV cache ใหม่ได้ตลอดเวลาโดยไม่สูญเสียข้อความจริง

## 1.2 Non-goals

- V1 และ V2 ไม่ได้ทำให้โมเดลมองเห็น 500K tokens พร้อมกันแบบ exact full attention
- ไม่รับประกันว่าสรุปอัตโนมัติจะถูกต้อง 100% จึงต้องเก็บ source references เสมอ
- ไม่ใช้ฐานข้อมูลเป็นที่เก็บ tensor ขนาดใหญ่โดยตรง
- ไม่เริ่มจากการแก้ CUDA kernel หรือ Attention runtime ก่อนระบบ Retrieval ผ่านการทดสอบ
- ไม่ใช้ KV block จากช่วงกลางแชทมาต่อกับ prefix ใหม่โดยไม่มี validation หรือ recomputation

# 2. หลักการออกแบบ

| หลักการ | คำอธิบาย |
| --- | --- |
| Text is the source of truth | ข้อความจริง, tool result และ metadata ต้องกู้คืนได้แม้ KV cache หายหรือเสีย |
| KV is rebuildable cache | KV ใช้ลด prefill แต่ลบและสร้างใหม่จาก token stream ได้ |
| Retrieve before generate | ค้น Rules, Decisions, Tasks, Recent Tail และหลักฐานเก่าก่อนประกอบ prompt |
| Budget before overflow | จองพื้นที่ output และ rollover ก่อน context window เต็ม |
| Evidence over summary | คำตอบที่อ้างความจำเก่าควรแนบ source message IDs หรือ internal references |
| Safe degradation | ถ้า vector index หรือ KV ใช้ไม่ได้ ให้ fallback เป็น FTS/ข้อความและ prefill ใหม่ |
| Versioned compatibility | KV และ embeddings ต้องผูกกับ model/tokenizer/template signature |

## 2.1 นิยาม Context 3 ระดับ

| ระดับ | ความหมาย | ตัวอย่างขนาด |
| --- | --- | --- |
| Logical Context | ประวัติทั้งหมดที่ระบบเก็บและค้นได้ | สูงสุด 500K tokens ต่อแชท |
| Active Context | ข้อความที่ประกอบให้โมเดลเห็นในรอบ inference ปัจจุบัน | 20K–44K tokens |
| KV Working Set | KV ที่อยู่ใน VRAM/RAM และถูก inference runtime ใช้จริง | ขึ้นกับ Active Context และ architecture |

## 2.2 Token budget เริ่มต้น

```text
System prompt / tool contract       2K–4K
Permanent rules                     2K–4K
Recent conversation                 8K–16K
Retrieved raw evidence              4K–16K
Working summary / project state     2K–4K
Reserved output                     4K–8K
Emergency reserve                   1K–2K
```

ตัวเลขทั้งหมดต้องเป็น configuration ตาม context window ของโมเดล ไม่ควร hard-code ที่ 44K สำหรับทุกโมเดล

# 3. สถาปัตยกรรมรวม

```text
┌──────────────────── Application / UI ────────────────────┐
│ Chat UI │ Session API │ Streaming │ Memory Inspector      │
└──────────────────────────────┬─────────────────────────────┘
                               │
┌──────────────────── Context Control Plane ────────────────┐
│ Context Router          │ Token Budget Manager            │
│ Context Retriever       │ Active Context Builder          │
│ Epoch Manager           │ Capsule Builder                 │
│ Structured Memory       │ Evidence / Source Resolver      │
└───────────────┬──────────────────────────┬─────────────────┘
                │                          │
┌───────────────▼──────────────┐   ┌───────▼─────────────────┐
│ Semantic Memory Plane       │   │ Attention Cache Plane   │
│ SQLite + FTS5               │   │ V2: Persistent KV       │
│ Vector index                │   │ V3: Selective KV        │
│ Messages / Rules / Tasks    │   │ VRAM → RAM → NVMe       │
└───────────────┬──────────────┘   └───────┬─────────────────┘
                │                          │
                └──────────────┬───────────┘
                               ▼
                     llama.cpp Inference Runtime
```

## 3.1 Storage architecture

```text
/context-vault/
├─ database/
│  └─ context-vault.db              # SQLite + WAL
├─ vector-index/
│  ├─ messages.hnsw
│  └─ capsules.hnsw
├─ chats/
│  └─ <chat-id>/
│     ├─ manifest.json
│     ├─ token-stream.bin
│     ├─ epochs/
│     │  ├─ epoch-000001/
│     │  │  ├─ capsule.json
│     │  │  ├─ segment-000001.kvpack
│     │  │  └─ checkpoint.kvpack
│     │  └─ epoch-000002/
│     └─ indexes/
│        └─ block-map.idx
├─ recovery/
│  └─ pending-writes/
└─ logs/
   └─ context-vault.jsonl
```

## 3.2 เทคโนโลยีที่แนะนำ

| ส่วน | ตัวเลือกเริ่มต้น | เหตุผล |
| --- | --- | --- |
| Service/API | NestJS + TypeScript | เข้ากับระบบปัจจุบัน แยกโมดูลและทดสอบง่าย |
| Database | SQLite + WAL | Local-first, transaction, crash recovery, ไม่ต้องมี DB server |
| Keyword search | SQLite FTS5 | เหมาะกับชื่อ class, path, function และคำค้นตรง |
| Semantic search | HNSW index แยกไฟล์ | ค้นความหมายได้เร็ว และ rebuild ได้จาก embeddings |
| KV storage | Binary append-only segment | ควบคุม offset, batch I/O, checksum และ mmap ได้ |
| Inference | llama.cpp server/runtime | มีพื้นฐาน prompt/KV cache ให้ต่อยอด และเหมาะกับ GGUF |
| Metrics | OpenTelemetry หรือ JSONL + Prometheus endpoint | วัด latency, hit rate, recall และ storage |

# 4. Data Model และฐานข้อมูล

## 4.1 ตารางหลักใน SQLite

| ตาราง | ข้อมูลสำคัญ | หน้าที่ |
| --- | --- | --- |
| chats | id, title, model_signature, total_tokens, active_epoch_id | สถานะระดับแชท |
| messages | role, content, token range, epoch, importance | ข้อความจริงทั้งหมด |
| epochs | sequence, token start/end, state, capsule_id | ช่วง Active Context ที่ถูกปิด/เปิด |
| memory_items | type, content, confidence, source ids, validity | Facts, Rules, Decisions, Tasks |
| capsules | summary, open tasks, constraints, source ids | สรุปแบบลำดับชั้น |
| kv_segments | path, offset, length, token range, signature, checksum | metadata ของไฟล์ KV |
| retrieval_events | query, candidates, selected, scores | ตรวจสอบคุณภาพ Retrieval |
| model_profiles | context size, tokenizer, template, KV format | compatibility และ budget |

## 4.2 Structured Memory Types

- **FACT** — ข้อเท็จจริงที่มี source และสามารถมีวันหมดอายุ
- **DECISION** — ข้อตกลงที่เลือกใช้ พร้อมทางเลือกที่ถูกปฏิเสธ
- **RULE** — ข้อกำหนดที่ห้ามเปลี่ยนโดยไม่แจ้งหรือขออนุมัติ
- **TASK** — งานค้าง สถานะ ผู้รับผิดชอบ dependency และ next action
- **PROJECT_STATE** — เวอร์ชัน สาขา ไฟล์สำคัญ และสถานะ implementation
- **OPEN_QUESTION** — ประเด็นที่ยังสรุปไม่ได้
- **EVIDENCE** — ข้อความหรือ tool result ที่รองรับ memory item
- **REJECTION** — วิธีที่เคยลองแล้วไม่ได้ผลและเหตุผล

## 4.3 ตัวอย่าง Memory Item

```json
{
  "id": "mem_decision_scan_roots_001",
  "chatId": "chat-a",
  "type": "DECISION",
  "project": "scan-file",
  "content": "ผู้ใช้เพิ่มโฟลเดอร์ได้เฉพาะภายใน SCAN_ALLOWED_ROOTS",
  "confidence": 0.96,
  "status": "ACTIVE",
  "sourceMessageIds": ["msg-102", "msg-108"],
  "createdAt": "2026-07-29T10:00:00Z",
  "lastVerifiedAt": "2026-07-29T10:00:00Z"
}
```

# 5. Lifecycle ของหนึ่งข้อความ

1. รับข้อความ User และบันทึก raw message ลง SQLite ก่อนเริ่ม inference
2. Token Budget Manager ประเมิน input, reserved output และ high-water mark
3. Context Router แยก project, intent, entities และชนิดความจำที่ต้องค้น
4. Retriever ค้น Recent Tail, FTS5, embeddings, Rules, Decisions, Tasks และ Capsules
5. Reranker ตัดข้อมูลซ้ำ จัดอันดับ และรักษาความหลากหลายของหลักฐาน
6. Active Context Builder ประกอบ prompt ตาม budget พร้อม source markers ภายใน
7. Inference runtime สร้างคำตอบและ stream กลับ UI
8. บันทึก assistant message และ token usage
9. Memory Extractor สร้าง candidate Facts/Decisions/Tasks แล้ว validate ก่อนบันทึก
10. Capsule/KV workers ทำงานหลังจบ turn โดยไม่ขวาง first-token latency

## 5.1 Context rollover เมื่อใกล้เต็ม

```text
คุยจน Active Context ถึง High-Water Mark
        ↓
หยุดเพิ่มข้อความลง Epoch เดิม
        ↓
บันทึกข้อความ / Structured Memory
        ↓
สร้าง Capsule พร้อม source references
        ↓
V2: Flush KV staging buffer เป็น segment บน SSD
        ↓
เลือก Recent Tail ประมาณ 2K–8K tokens
        ↓
เปิด Epoch ใหม่
        ↓
ประกอบ Capsule + Rules + Recent Tail + Retrieved Evidence
        ↓
Prefill และคุยต่อในแชทเดิม
```

## 5.2 Threshold ที่แนะนำ

| ช่วงการใช้ context | สถานะ | การกระทำ |
| --- | --- | --- |
| 0–70% | Normal | ตอบและเก็บ memory ตามปกติ |
| 70–80% | Prepare | เริ่มสร้าง/อัปเดต Capsule และประเมินข้อความที่จะ evict |
| 80–90% | Rollover | ปิด Epoch ก่อนรับ turn ที่จะทำให้เกิน budget |
| 90–100% | Emergency | ลด retrieved context, บังคับสรุป และสงวน output |

---

# 6. ContextVault V1 — Semantic Memory

> **เป้าหมาย V1:** ทำให้ระบบจำและค้นประวัติรวม 500K tokens เชิงตรรกะได้ โดยไม่แก้ Attention kernel และไม่พึ่ง KV persistence

## 6.1 ขอบเขตฟีเจอร์

- Message Store และ Chat/Epoch lifecycle
- Token Budget Manager และ high-water rollover
- SQLite FTS5 สำหรับ exact/keyword search
- Embedding pipeline และ HNSW semantic index
- Context Router และ hybrid retrieval
- Structured Memory: Facts, Decisions, Rules, Tasks, Project State
- Hierarchical Summary และ Context Capsule
- Active Context Builder พร้อม deduplication และ source markers
- Memory Inspector API สำหรับดูว่าโมเดลเลือก Context อะไร
- Fallback path เมื่อ embedding/index ใช้ไม่ได้

## 6.2 โมดูล NestJS ที่แนะนำ

```text
src/context-vault/
├─ context-vault.module.ts
├─ chat/
│  ├─ chat.controller.ts
│  ├─ chat.service.ts
│  └─ chat.repository.ts
├─ message-store/
├─ token-budget/
├─ context-router/
├─ retrieval/
│  ├─ keyword-retriever.service.ts
│  ├─ semantic-retriever.service.ts
│  ├─ structured-memory-retriever.service.ts
│  └─ reranker.service.ts
├─ active-context/
├─ epoch/
├─ capsule/
├─ memory/
├─ embeddings/
├─ indexing/
├─ observability/
└─ shared/
```

## 6.3 Retrieval pipeline

```text
User query
  ├─ Query normalization
  ├─ Entity / project detection
  ├─ FTS5 Top-N
  ├─ Vector Top-N
  ├─ Structured Memory lookup
  ├─ Recent Tail
  ├─ Capsule lookup
  └─ Rerank + deduplicate + token-budget selection
                         ↓
                  Active Context
```

### Scoring เบื้องต้น

```text
final_score =
    semantic_score      * 0.35 +
    keyword_score       * 0.25 +
    recency_score       * 0.10 +
    importance_score    * 0.15 +
    source_confidence   * 0.10 +
    project_match       * 0.05
```

น้ำหนักต้องปรับจาก benchmark จริง และควรแยก profile ระหว่างคำถามเชิงโค้ด คำถามการตัดสินใจ และการสนทนาทั่วไป

## 6.4 Capsule hierarchy

| ชนิด | ช่วงแนะนำ | เนื้อหา |
| --- | --- | --- |
| Turn/Chunk Summary | 8K–16K tokens | หัวข้อ เหตุการณ์สำคัญ และ source ranges |
| Topic Capsule | 32K–64K tokens | สรุปเฉพาะ project/topic พร้อม decisions และ tasks |
| Session Capsule | 100K–200K tokens | เป้าหมายใหญ่ สถานะล่าสุด กฎ และงานค้าง |
| Final Capsule | ปิดแชทหรือครบ 500K | ข้อมูลสำหรับเปิด Chat ใหม่และ index ย้อนกลับ |

## 6.5 API หลักของ V1

| Method | Endpoint | หน้าที่ |
| --- | --- | --- |
| POST | /api/chats | สร้างแชทและ model profile |
| POST | /api/chats/:id/messages | บันทึกข้อความ ประกอบ context และตอบแบบ stream |
| GET | /api/chats/:id/context-preview | แสดง token budget และ context ที่จะถูกเลือก |
| GET | /api/chats/:id/memories | ดู Facts/Rules/Decisions/Tasks |
| PATCH | /api/memories/:id | แก้ ยืนยัน ปักหมุด หรือยกเลิก memory item |
| POST | /api/chats/:id/rollover | บังคับปิด Epoch และสร้าง Capsule |
| GET | /api/chats/:id/retrieval-events | ตรวจสอบ candidate/selected context |
| POST | /api/index/rebuild | สร้าง FTS/vector index ใหม่จาก source of truth |

## 6.6 Milestones ของ V1

| Milestone | งานหลัก | ผลลัพธ์ |
| --- | --- | --- |
| V1.0 Foundation | Schema, repositories, chat/message/epoch, token counter | เก็บแชทและคำนวณ budget ได้ |
| V1.1 Retrieval | FTS5, embeddings, HNSW, reranker | ค้นข้อความเก่าแบบ hybrid ได้ |
| V1.2 Memory | Extractor, Rules/Decisions/Tasks, source validation | จำข้อมูลสำคัญแบบ structured |
| V1.3 Rollover | Capsule, Recent Tail, Active Context Builder | คุยเกิน context window ได้ |
| V1.4 Inspector | Context preview, retrieval logs, metrics | ตรวจสอบได้ว่าเลือกข้อมูลอะไร |
| V1.5 Hardening | Recovery, migrations, benchmark, security | พร้อมใช้งานจริงใน Local app |

## 6.7 Definition of Done — V1

- แชททดสอบรวมอย่างน้อย 500K tokens โดยเปิด Epoch ใหม่อัตโนมัติและไม่มี raw message สูญหาย
- คำถามชุด benchmark ด้าน Decisions/Rules/Tasks มี retrieval recall@k ตามเกณฑ์ที่ทีมกำหนด
- ทุก memory item มี source message IDs และสามารถเปิดดูข้อความต้นฉบับได้
- เมื่อ vector index เสีย ระบบ rebuild ได้และยัง fallback ไป FTS5 ได้
- Rollover ไม่ทำให้ first-token request ถัดไปล้มเหลว และรักษา recent tail ถูกต้อง
- มี unit, integration และ end-to-end tests ครอบคลุม recovery และ token budgeting
- Memory Inspector แสดง selected chunks, scores และ token contribution ได้

---

# 7. ContextVault V2 — Persistent KV

> **เป้าหมาย V2:** ลด prefill ซ้ำและทำให้เปิด/คุยต่อในแชทเก่าเร็วขึ้น โดยใช้ KV เฉพาะกรณีที่ compatibility และ prefix validation ผ่าน

## 7.1 ขอบเขตฟีเจอร์

- KV serialization/deserialization สำหรับโมเดลที่รองรับ
- Binary append-only KV segment store บน NVMe
- RAM staging buffer และ batch writer
- Hot/Warm/Cold cache manager ระหว่าง VRAM, RAM และ SSD
- Exact-prefix checkpoint restore
- Model Signature และ Prefix Hash validation
- Prefetch scheduler และ asynchronous I/O
- LRU/importance/rebuild-cost eviction
- Checksum, atomic commit และ crash recovery
- Metrics: restore hit rate, bytes read, prefill saved และ corruption count

## 7.2 ข้อจำกัดสำคัญ

- KV ของช่วงกลางแชทไม่สามารถย้ายมาต่อกับ prefix ใหม่ได้อย่างอิสระ
- ถ้า model, GGUF, tokenizer, chat template, RoPE หรือ KV format เปลี่ยน ต้อง invalidate KV ที่ไม่เข้ากัน
- Context Capsule และข้อความยังต้องทำงานได้แม้ปิด V2 ทั้งหมด
- V2 ต้องมี fallback เป็น textual prefill เสมอ
- การเขียน KV ต้องไม่บล็อก token streaming โดยไม่จำเป็น

## 7.3 KV file design

```text
KVPack Header
├─ magic / version
├─ model signature
├─ chat / epoch / segment id
├─ token start / token end
├─ layer layout
├─ quantization format
├─ block count
├─ payload checksum
└─ index offset

Payload
├─ logical block 0001
├─ logical block 0002
└─ ...

Footer Index
├─ block id
├─ layer / token range
├─ byte offset / byte length
└─ block checksum
```

### ขนาด block ที่แนะนำ

| ระดับ | ขนาดเริ่มต้น | หน้าที่ |
| --- | --- | --- |
| Logical KV block | 128–512 tokens | metadata, importance และ future selective retrieval |
| Physical segment | 1K–4K tokens หรือ 16–128 MiB | batch SSD I/O และลดจำนวนไฟล์ |
| Checkpoint | ตามจุดจบ turn/epoch | restore exact prefix ได้รวดเร็ว |

## 7.4 Write path

```text
KV ใหม่บน VRAM
      ↓
คัดลอกเข้า RAM staging buffer
      ↓  trigger: จบ response / buffer เต็ม / ปิด epoch
เขียน <segment>.tmp
      ↓
flush + checksum
      ↓
atomic rename เป็น .kvpack
      ↓
SQLite transaction บันทึก metadata
      ↓
commit และ mark segment READY
```

## 7.5 Read/restore path

```text
Request ต่อแชทเดิม
      ↓
คำนวณ model_signature + prefix_hash
      ↓
ค้น checkpoint ที่ compatible
      ├─ ไม่พบ → textual prefill
      └─ พบ
           ↓
       SSD prefetch → RAM
           ↓
       checksum validation
           ↓
       restore เข้า inference runtime
           ↓
       prefill เฉพาะ suffix ใหม่
```

## 7.6 Model Signature ขั้นต่ำ

```json
{
  "modelHash": "...",
  "ggufHash": "...",
  "tokenizerHash": "...",
  "chatTemplateHash": "...",
  "ropeConfigHash": "...",
  "contextConfigHash": "...",
  "layerLayoutHash": "...",
  "kvFormat": "q8_0",
  "runtimeVersion": "llama.cpp-<commit>"
}
```

## 7.7 Cache policies

| ชั้น | ข้อมูล | Eviction policy |
| --- | --- | --- |
| Hot — VRAM | Active prefix, recent KV, generation buffers | evict เมื่อจบ slot หรือกดดัน VRAM |
| Warm — RAM | recent checkpoints และ prefetch candidates | weighted LRU + predicted reuse |
| Cold — SSD | closed epochs และ reusable checkpoints | quota + rebuild cost + last access |

## 7.8 Milestones ของ V2

| Milestone | งานหลัก | ผลลัพธ์ |
| --- | --- | --- |
| V2.0 Prototype | serialize/restore KV ของหนึ่ง slot | พิสูจน์ว่า runtime ต่อ KV ได้ถูกต้อง |
| V2.1 Segment Store | kvpack, metadata, checksum, atomic writes | เก็บ KV บน SSD อย่างปลอดภัย |
| V2.2 Tier Manager | RAM cache, prefetch, eviction | ลด SSD latency และควบคุม memory |
| V2.3 Compatibility | model signature, prefix hash, invalidation | ป้องกัน restore ผิดโมเดล/ผิด prefix |
| V2.4 Recovery | orphan scan, corruption fallback, rebuild | ระบบไม่พังเมื่อไฟล์เสีย/โปรแกรมดับ |
| V2.5 Benchmark | TTFT, prefill saved, hit rate, SSD wear | ตัดสินใจเปิดใช้เป็นค่า default |

## 7.9 Definition of Done — V2

- Restore checkpoint แล้ว logits/ผลลัพธ์อยู่ใน tolerance ที่กำหนดเมื่อเทียบกับ prefill ปกติ
- KV ที่ signature หรือ prefix ไม่ตรงถูกปฏิเสธและ fallback โดยอัตโนมัติ
- การเขียน segment ใช้ atomic workflow และมี recovery test สำหรับ crash ทุกจุดสำคัญ
- TTFT ของการ resume แชทยาวดีขึ้นอย่างมีนัยสำคัญใน benchmark ของเครื่องเป้าหมาย
- ไม่เขียน SSD ทุก token และมีตัวเลข bytes written ต่อ turn/ต่อวันให้ตรวจสอบ
- ลบ KV store ทั้งหมดแล้วระบบยังตอบจากข้อความและสร้าง cache ใหม่ได้
- มี storage quota และ eviction ที่ไม่ลบ raw messages

# 8. ContextVault V3 — Selective Attention

> **สถานะ V3:** เป็นงานทดลองด้าน inference research ไม่ควรถูกผูกเป็น dependency ของ V1/V2 และควรมี feature flag กับ benchmark gate แยก

## 8.1 เป้าหมาย

ให้ inference runtime เลือก KV block ที่เกี่ยวข้องกับ Query vector ของ token/layer ปัจจุบัน แทนการโหลด KV ทั้ง Logical Context เข้า VRAM พร้อมกัน โดยต้องรักษาคุณภาพคำตอบให้อยู่ใน tolerance ที่ยอมรับได้

## 8.2 โมดูลวิจัย

- Attention KV Indexer แยกตาม layer/head หรือกลุ่มที่เหมาะสม
- Dynamic KV Retriever ระหว่าง inference
- Sparse Attention runtime/kernel
- Position remapping และ RoPE-aware selection
- Non-prefix KV fusion หรือ memory-attention mechanism
- Partial KV recompute / cross-attention repair
- GPU–RAM–SSD pipelined prefetch
- Quality Validator และ fallback ไป full/textual context

## 8.3 Runtime flow เชิงแนวคิด

```text
Generated token N
  ↓
Layer L สร้าง Query vector
  ↓
Attention-aware index เลือก Top-K blocks
  ↓
Recent KV + pinned KV + retrieved KV
  ↓
Prefetch missing blocks SSD → RAM → VRAM
  ↓
Sparse Attention
  ↓
ตรวจ quality/coverage และไป Layer ถัดไป
```

## 8.4 ปัญหาวิจัยที่ต้องพิสูจน์

| ปัญหา | คำถามที่ต้องตอบ |
| --- | --- |
| Non-prefix correctness | KV เก่าที่สร้างภายใต้ prefix เดิมจะใช้กับ context ใหม่ได้อย่างไร |
| RoPE/position | ต้อง remap ตำแหน่งแบบใดจึงไม่ทำลาย attention score |
| Retrieval granularity | ค้นทุก token/layer/head หรือ batch อย่างไรให้ latency คุ้ม |
| Index overhead | ขนาด index และเวลาค้นมากกว่าประโยชน์จาก KV ที่ลดลงหรือไม่ |
| SSD latency | prefetch ล่วงหน้าได้แม่นพอหรือ GPU จะหยุดรอ I/O |
| Quality drift | คำตอบเปลี่ยนจาก full attention มากเพียงใดใน long-context tasks |
| Hybrid architecture | โมเดลที่มี linear attention ต้อง checkpoint/recombine state อย่างไร |

## 8.5 Experiments ที่ควรทำตามลำดับ

1. Offline attention analysis: บันทึก attention patterns จากชุดทดสอบยาวและวัดว่า Top-K block recovery ได้เท่าไร
2. Static block selection: เลือก KV ก่อน generation หนึ่งครั้งและวัด quality/latency
3. Layer-group retrieval: ใช้ retrieval ต่อกลุ่ม layer แทนทุก head เพื่อลด overhead
4. Partial recompute prototype: คำนวณใหม่เฉพาะ retrieved text บางส่วนแล้วเปรียบเทียบ logits
5. Sparse attention kernel prototype บน synthetic benchmark
6. SSD/RAM pipeline พร้อม pinned memory และ asynchronous transfer
7. End-to-end long-context benchmark เทียบ Full Prefill, V1 Retrieval, V2 Restore และ V3 Selective KV

## 8.6 Definition of Done — V3 Research Gate

- มี benchmark ที่ทำซ้ำได้และมี baseline อย่างน้อย V1 textual retrieval กับ full-context reference
- คุณภาพผ่าน threshold ที่กำหนดใน retrieval-heavy, needle, code-decision และ conversation continuity tests
- ลด peak KV VRAM หรือ TTFT/throughput ได้จริงหลังรวมค่า index และ I/O overhead
- ระบบตรวจ low-confidence และ fallback ได้โดยไม่คืนคำตอบที่ไม่สมบูรณ์
- ไม่มี dependency ที่บังคับให้ production V1/V2 ใช้ V3
- เอกสารข้อจำกัดชัดเจน และ feature ถูกปิดโดยค่าเริ่มต้นจนผ่าน gate

# 9. Cross-cutting Requirements

## 9.1 Reliability และ Recovery

- Raw message ต้อง commit ก่อนเริ่มหรืออย่างช้าที่สุดพร้อมสถานะ PENDING ก่อน inference
- Assistant streaming ควรมี incremental text journal เพื่อกู้คำตอบบางส่วนหลัง process crash
- Capsule และ vector index เป็น derived data สามารถ rebuild ได้
- KV segment ต้องมี checksum และสถานะ WRITING/READY/CORRUPT/INVALID
- startup recovery ต้องค้น orphan .tmp, orphan kvpack และ metadata ที่ชี้ไฟล์หาย
- ทุก migration ต้องมี backup และ rollback plan

## 9.2 Security และ Privacy

- จำกัด root directory ของ ContextVault และป้องกัน path traversal/symlink escape
- ไฟล์แชทและ KV ควรสืบทอดสิทธิ์เฉพาะ user ของแอป
- รองรับ encryption-at-rest เป็น optional profile สำหรับเครื่องที่มีข้อมูลอ่อนไหว
- ห้ามเขียนข้อความเต็มลง log โดยค่าเริ่มต้น ให้ใช้ IDs, sizes และ hashes
- มี Delete Chat ที่ลบ raw messages, capsules, embeddings และ KV segments ครบ
- Memory Inspector ต้องแสดง source และอนุญาตให้ผู้ใช้ลบ/แก้ memory ที่ไม่ถูกต้อง

## 9.3 Performance budgets ที่ต้องวัด

| Metric | ความหมาย | เป้าหมายเริ่มต้น |
| --- | --- | --- |
| Retrieval latency P95 | เวลาค้นและ rerank ก่อน prefill | ตั้ง budget แยกตามเครื่อง; เริ่มที่ < 300 ms |
| Context build latency P95 | เวลาตัดซ้ำและประกอบ prompt | < 100 ms หลัง retrieval |
| Recall@K | หลักฐานที่ต้องใช้ติดใน selected context หรือไม่ | กำหนดจาก benchmark; เน้น Rules/Decisions |
| TTFT | เวลาจาก request ถึง token แรก | V2 ต้องดีกว่า textual prefill ใน resume cases |
| KV restore hit rate | สัดส่วน request ที่ใช้ exact-prefix checkpoint ได้ | เก็บเป็น metric ก่อนตั้งเป้า |
| Storage growth | bytes ต่อ 1K tokens แยก raw/vector/KV | มี quota และ dashboard |
| Recovery success | กู้หลัง injected crash ได้หรือไม่ | 100% raw messages; KV fallback ได้ |

## 9.4 Observability

- Request ID, chat ID, epoch ID และ model signature ในทุก trace
- Token budget breakdown ต่อ turn
- Candidate และ selected chunks พร้อม score/เหตุผล
- Capsule creation latency และ source coverage
- FTS/vector hit rate และ fallback count
- KV bytes written/read, restore validation failures และ eviction reasons
- Dashboard สำหรับ context size, total logical tokens และ storage quota

# 10. แผนการทดสอบ

## 10.1 Test pyramid

| ระดับ | ตัวอย่าง |
| --- | --- |
| Unit | token budgeting, scoring, signature hashing, capsule validation, path guard |
| Integration | SQLite WAL, FTS5, HNSW, index rebuild, epoch transaction, segment metadata |
| End-to-end | คุยข้าม Epoch, restart process, resume chat, delete chat, corrupted cache |
| Benchmark | retrieval recall, long conversation continuity, TTFT, SSD throughput |
| Fault injection | kill ระหว่าง write, disk full, checksum fail, missing index, model change |

## 10.2 ชุดทดสอบความจำ

- **Needle recall** — ฝังข้อมูลเฉพาะในตำแหน่งต่าง ๆ แล้วถามย้อนกลับ
- **Decision consistency** — เปลี่ยน topic หลายรอบแล้วถามข้อตกลงเดิม
- **Rule precedence** — มีกฎเก่า กฎใหม่ และสถานะ superseded
- **Task continuity** — สร้างงานค้าง dependency และถาม next action หลังหลาย Epoch
- **Code identifiers** — ทดสอบชื่อ function/path ที่ semantic search มักพลาด
- **Contradiction handling** — มีข้อมูลขัดกันและตรวจว่าระบบเลือกข้อมูลล่าสุด/ที่ยืนยันแล้ว
- **Summary drift** — เปรียบเทียบ Capsule กับ raw evidence และตรวจ source coverage
- **Rollover continuity** — คำถามที่พาดผ่านขอบ Epoch และ recent overlap

## 10.3 Benchmark matrix

| Scenario | V1 | V2 | V3 |
| --- | --- | --- | --- |
| แชทใหม่ | Baseline | เหมือน V1 | ทดลอง selective attention |
| คุยต่อ prefix เดิม | Textual prefill | Checkpoint restore | Restore + selective |
| ถามรายละเอียดเก่า | Hybrid textual retrieval | เหมือน V1 + cache | Attention-aware KV |
| เปลี่ยนโมเดล | Embeddings อาจ rebuild | KV invalidated | Index/KV invalidated |
| KV store เสีย | ไม่กระทบ | Fallback V1 | Fallback V1/V2 |

# 11. ความเสี่ยงและแนวทางลดความเสี่ยง

| ความเสี่ยง | ผลกระทบ | แนวทาง |
| --- | --- | --- |
| Summary hallucination | จำกฎหรือข้อตกลงผิด | source references, confidence, user correction, retrieve raw evidence |
| Retrieval miss | โมเดลตอบเหมือนไม่จำ | hybrid search, reranker, benchmark, query expansion |
| Context stuffing | ข้อมูลมากเกินจนคำตอบแย่ | token budget, diversity cap, deduplication, relevance threshold |
| Index corruption | ค้นไม่ได้ | index เป็น derived data และ rebuild จาก SQLite |
| KV incompatibility | ผลลัพธ์ผิดหรือ runtime crash | strict model signature และ prefix hash |
| SSD write amplification | อายุ SSD ลด/latency เพิ่ม | batch write, compression, quota, metrics |
| V3 latency overhead | ช้ากว่า full prefill | prototype gate, async pipeline, fallback |
| Scope explosion | V1 ไม่เสร็จเพราะรีบทำ kernel | แยก roadmap และห้าม V3 block production |

# 12. Roadmap การพัฒนา

ระยะเวลาให้ใช้เป็นลำดับงาน ไม่ใช่คำมั่นกำหนดส่ง เนื่องจากขึ้นกับจำนวนผู้พัฒนา ความพร้อมของ llama.cpp integration และผล benchmark

| ลำดับ | Phase | Deliverable หลัก | Dependency |
| --- | --- | --- | --- |
| 1 | V1 Foundation | SQLite schema, Chat/Message/Epoch, token budget | ไม่มี |
| 2 | V1 Retrieval | FTS5 + embeddings + reranker + inspector | Foundation |
| 3 | V1 Memory/Rollover | Structured memory, capsules, active context | Retrieval |
| 4 | V1 Hardening | Recovery, security, benchmark, migrations | V1 ทั้งหมด |
| 5 | V2 KV Prototype | serialize/restore exact prefix | V1 stable |
| 6 | V2 Storage/Tiering | kvpack, RAM cache, prefetch, eviction | KV prototype |
| 7 | V2 Production Gate | compatibility, crash recovery, performance | V2 storage |
| 8 | V3 Research | attention index, sparse retrieval, partial recompute | Benchmark harness |

## 12.1 งานที่ควรเริ่มใน Sprint แรก

1. สร้าง ContextVault module และ configuration schema
2. สร้าง SQLite migrations สำหรับ chats, messages, epochs และ model_profiles
3. ทำ tokenizer adapter เพื่อคำนวณ token count ตรงกับโมเดล
4. ทำ Token Budget Manager พร้อม reserved output และ rollover decision
5. สร้าง Message Store transaction และสถานะ PENDING/COMPLETED/FAILED
6. ทำ API context-preview ให้เห็น budget ก่อนต่อ inference
7. สร้าง test fixture แชทยาวและ fault-injection test แรก
8. บันทึก metrics พื้นฐาน: logical tokens, active tokens, latency และ DB size

## 12.2 สิ่งที่ห้ามเริ่มใน Sprint แรก

- CUDA sparse attention kernel
- การบีบอัด KV Q4/Q8 แบบ custom
- การดึง KV non-prefix จากช่วงกลางแชท
- RocksDB/MySQL cluster หรือ distributed storage
- ระบบ multi-user permission ที่เกินขอบเขต Local single-user
- optimization ก่อนมี benchmark และ correctness tests

# 13. Configuration Draft

```yaml
contextVault:
  enabled: true
  logicalTokenLimit: 500000

  activeContext:
    modelContextSize: 32768
    reservedOutputTokens: 6144
    emergencyReserveTokens: 1024
    rolloverHighWatermark: 0.82
    recentTailTokens: 4096

  retrieval:
    keywordTopK: 30
    semanticTopK: 30
    rerankTopK: 12
    minimumScore: 0.25
    maxRetrievedTokens: 12000

  capsules:
    chunkIntervalTokens: 12000
    topicIntervalTokens: 48000
    sessionIntervalTokens: 150000

  storage:
    root: ./data/context-vault
    sqliteWal: true
    maxStorageGb: 100

  kv:
    enabled: false                  # เปิดใน V2
    stagingBufferMb: 256
    segmentTargetMb: 64
    format: q8_0
    verifyChecksum: true

  experimental:
    selectiveAttention: false       # เปิดเฉพาะ V3 research
```

# 14. Acceptance Criteria ระดับระบบ

- ผู้ใช้สามารถคุยใน Chat เดียวจน Logical Context ถึง 500K tokens โดย UI ไม่สร้าง Chat ใหม่โดยไม่จำเป็น
- ระบบเปิด Epoch ใหม่อัตโนมัติก่อน Active Context เกิน model limit
- กฎและการตัดสินใจสำคัญถูกดึงกลับมาเมื่อถามด้วยถ้อยคำต่างจากต้นฉบับ
- ผู้ใช้ตรวจสอบและแก้ Memory ที่ระบบสกัดได้
- ข้อความต้นฉบับไม่สูญหายจากการ rebuild index, delete KV หรือเปลี่ยน model profile
- เมื่อระบบย่อยล้มเหลว มี fallback ที่ยังคงตอบได้หรือแจ้งสถานะอย่างชัดเจน
- ทุก optimization ของ V2/V3 ต้องผ่าน correctness benchmark ก่อนเปิดเป็น default

# 15. สรุปการตัดสินใจเชิงสถาปัตยกรรม

| หัวข้อ | การตัดสินใจ |
| --- | --- |
| ฐานข้อมูลหลัก | SQLite + WAL |
| ข้อความค้นหา | SQLite FTS5 |
| Semantic index | HNSW แยกไฟล์และ rebuild ได้ |
| KV tensor | Binary append-only segments บน NVMe; ไม่เก็บ BLOB ใหญ่ใน DB |
| Source of truth | Raw messages + structured memory พร้อม source references |
| Context overflow | Context Epoch + Capsule + Recent Tail + Retrieval |
| KV writing | Batch หลังจบ turn/buffer/full/rollover; ไม่เขียนทุก token |
| KV reuse V2 | Exact-prefix และ compatibility ผ่านเท่านั้น |
| Selective KV | V3 research แยกจาก production |
| Implementation order | V1 ทำให้จำถูก → V2 ทำให้เร็ว → V3 ทำให้ Attention ฉลาด |

> ContextVault ต้องเก็บข้อความเป็นความจริง ใช้ Capsule เพื่อรักษาความต่อเนื่อง และใช้ KV เป็น Cache เพื่อเร่งการประมวลผล—not as the only memory.

# ภาคผนวก A — Glossary

| คำ | ความหมาย |
| --- | --- |
| Active Context | ข้อความจริงที่ส่งเข้าโมเดลใน inference รอบปัจจุบัน |
| Logical Context | ประวัติทั้งหมดที่ระบบเก็บและค้นคืนได้ |
| Context Epoch | ช่วง Active Context หนึ่งชุดก่อน rollover |
| Context Capsule | สรุปแบบมีโครงสร้างและอ้างอิงข้อความต้นฉบับ |
| Recent Tail | ข้อความช่วงท้ายของ Epoch เดิมที่ยกมาเพื่อรักษาความต่อเนื่อง |
| KV Cache | Key/Value tensors ที่ช่วยให้ generation ไม่ต้องคำนวณ prefix ซ้ำ |
| Exact Prefix | ลำดับ token ก่อนหน้าตรงกันทั้งหมดกับตอนสร้าง KV |
| Model Signature | hash ชุดการตั้งค่าที่ใช้ตรวจว่า cache ใช้ร่วมกันได้หรือไม่ |
| Prefill | การประมวลผล input tokens เพื่อสร้างสถานะก่อนเริ่ม generate |
| TTFT | Time to First Token |
| FTS5 | ระบบ full-text search ของ SQLite |
| HNSW | โครงสร้าง approximate nearest-neighbor สำหรับ vector search |

# ภาคผนวก B — Checklist ก่อนเริ่ม Coding

- ยืนยันโมเดลเป้าหมายและ context window จริง
- ยืนยัน tokenizer adapter และ chat template
- กำหนด root storage และ storage quota
- สร้าง benchmark dataset ก่อน tuning retrieval
- กำหนด data retention และ Delete Chat behavior
- กำหนด Definition of Done ของ V1 ให้ทีมยอมรับร่วมกัน
- ล็อก V2/V3 หลัง feature flags เพื่อไม่กระทบเส้นทาง production
- ทำ migration/recovery harness ตั้งแต่ schema รุ่นแรก
