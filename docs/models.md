# คู่มือ: โหลดและใช้งาน Model (GGUF)

คู่มือนี้อธิบายวิธีโหลด model จาก Hugging Face Hub เข้ามาไว้ใน `models\` แล้วเอาไปรันกับ `my-local-ai`
ทุกอย่างทำผ่าน [`scripts/my-local-ai/download-model.mjs`](../scripts/my-local-ai/download-model.mjs) ซึ่งเรียกใช้ผ่าน pnpm

---

## 1. เตรียมเครื่อง (ทำครั้งเดียว)

ต้องมี Python + `huggingface_hub` ติดตั้งอยู่:

```bash
py -m pip install --upgrade huggingface_hub
```

**ไม่ต้อง** ตั้ง PATH ให้ `hf.exe` เอง — script หามันให้อัตโนมัติ (ดูรายละเอียดในหัวข้อ [การหา hf CLI](#การหา-hf-cli))

เช็คว่าพร้อมแล้วด้วยการสั่ง:

```bash
pnpm my-local-ai:model:list
```

ถ้าขึ้นรายการ preset มาแสดงว่าใช้ได้แล้ว

จากนั้นสร้างไฟล์ `.env` จากตัวอย่าง (ไฟล์ `.env` อยู่ใน `.gitignore` ไม่ถูก commit):

```bash
cp .env.example .env
```

ดูรายละเอียดตัวแปรทั้งหมดที่หัวข้อ [ตั้งค่าผ่าน .env](#7-ตั้งค่าผ่าน-env)

---

## 2. โหลด model

### แบบง่ายสุด — ใช้ preset

```bash
pnpm my-local-ai:model qwen-coder-7b
```

ไฟล์จะไปอยู่ที่ `models\qwen-coder-7b\Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf`
พอโหลดเสร็จ script จะพิมพ์ path เต็มกับคำสั่งที่เอาไปรันต่อได้เลย

### ดู preset ทั้งหมด

```bash
pnpm my-local-ai:model:list
```

| preset            | repo                                         | ขนาดไฟล์ Q4_K_M |
| ----------------- | -------------------------------------------- | --------------- |
| `qwen-coder-1.5b` | `bartowski/Qwen2.5-Coder-1.5B-Instruct-GGUF` | 0.92 GB         |
| `qwen-coder-7b`   | `bartowski/Qwen2.5-Coder-7B-Instruct-GGUF`   | 4.36 GB         |
| `qwen-coder-14b`  | `bartowski/Qwen2.5-Coder-14B-Instruct-GGUF`  | 8.37 GB         |
| `qwen3-4b`        | `unsloth/Qwen3-4B-Instruct-2507-GGUF`        | 2.33 GB         |
| `qwen3-8b`        | `unsloth/Qwen3-8B-GGUF`                      | 4.68 GB         |
| `llama-3.1-8b`    | `bartowski/Meta-Llama-3.1-8B-Instruct-GGUF`  | 4.58 GB         |
| `gemma-3-4b`      | `unsloth/gemma-3-4b-it-GGUF`                 | 2.32 GB         |

### โหลด repo อื่นที่ไม่มีใน preset

ใส่ `owner/repo` ตรงๆ ได้เลย:

```bash
pnpm my-local-ai:model bartowski/Qwen2.5-Coder-3B-Instruct-GGUF --dir qwen-coder-3b
```

ถ้าไม่ใส่ `--dir` script จะตั้งชื่อโฟลเดอร์ให้เองจากชื่อ repo (ตัด `-GGUF` ออก แล้วแปลงเป็นตัวพิมพ์เล็ก)

---

## 3. Options

| Option            | ความหมาย                                                        | Default              |
| ----------------- | --------------------------------------------------------------- | -------------------- |
| `--quant <name>`  | เลือก quantization เช่น `Q4_K_M`, `Q5_K_M`, `Q8_0`               | `Q4_K_M`             |
| `--file <ชื่อ>`   | ระบุชื่อไฟล์หรือ glob ตรงๆ (ใช้แทน `--quant`)                    | `*<quant>.gguf`      |
| `--dir <ชื่อ>`    | โฟลเดอร์ปลายทาง ถ้าใส่ชื่อเปล่าๆ จะลงที่ `models\<ชื่อ>`         | ชื่อ preset / repo   |
| `--revision <rev>`| branch / tag / commit ที่ต้องการ                                 | `main`               |
| `--token <token>` | HF token สำหรับ repo ที่ต้องขอสิทธิ์ (gated)                     | `$HF_TOKEN`          |
| `--set-env`       | เขียน `MODEL_PRESET` ลง `.env` ให้ตัวนี้เป็น model เริ่มต้น       | —                    |
| `--list`, `-l`    | แสดง preset ทั้งหมดแล้วจบ                                        | —                    |
| `--help`, `-h`    | แสดงวิธีใช้                                                      | —                    |

ถ้าไม่ใส่ชื่อ model เลย จะโหลดตัวที่ตั้งไว้ใน `MODEL_PRESET` ของ `.env`

ตัวอย่าง:

```bash
pnpm my-local-ai:model qwen-coder-7b --quant Q5_K_M
```

```bash
pnpm my-local-ai:model qwen-coder-7b --file "Qwen2.5-Coder-7B-Instruct-Q8_0.gguf"
```

---

## 4. เลือก quant ยังไง

quant คือระดับการบีบอัดน้ำหนัก model — ยิ่งเลขต่ำยิ่งไฟล์เล็ก/เร็ว แต่คุณภาพลดลง

| quant    | ใช้เมื่อ                                                  |
| -------- | --------------------------------------------------------- |
| `Q4_K_M` | ค่าเริ่มต้นที่แนะนำ — สมดุลระหว่างขนาดกับคุณภาพดีที่สุด    |
| `Q5_K_M` | มี VRAM/RAM เหลือ อยากได้คุณภาพเพิ่มอีกนิด                 |
| `Q8_0`   | เน้นคุณภาพสูงสุด ไฟล์ใหญ่ประมาณ 2 เท่าของ Q4               |
| `Q3_K_M` | เครื่องแรมน้อยจริงๆ ยอมให้คุณภาพตกได้                      |

เกณฑ์คร่าวๆ: ไฟล์ `.gguf` ควรเล็กกว่า VRAM ของการ์ดจอราว 1–2 GB ถึงจะโหลดขึ้น GPU ได้ทั้งก้อน

---

## 5. เอา model ไปรัน

**วิธีที่ง่ายที่สุด** — ตั้งใน `.env` ครั้งเดียว แล้วไม่ต้องพิมพ์ path อีกเลย:

```bash
pnpm my-local-ai:model qwen-coder-7b --set-env
```

`--set-env` จะเขียน `MODEL_PRESET=qwen-coder-7b` ลง `.env` ให้ ต่อจากนั้นสั่งสั้นๆ ได้เลย:

```bash
pnpm my-local-ai:dev
```

- `my-local-ai:dev` = รัน llama-server (พอร์ต `8080`) + UI dev server (Vite `5173`, Storybook `6006`) พร้อมกัน
- ถ้าอยากรันแค่ server เฉยๆ ก็ `pnpm my-local-ai:server`

**อยากรัน model อื่นชั่วคราว** โดยไม่แก้ `.env` ก็ใส่ `-m` ต่อท้าย flag จะชนะค่าใน `.env` เสมอ:

```bash
pnpm my-local-ai:dev -- -m "D:\my-work-3\models\qwen3-8b\Qwen3-8B-Q4_K_M.gguf"
```

> ต้อง `pnpm my-local-ai:configure` และ `pnpm my-local-ai:build` มาก่อน ไม่งั้นจะยังไม่มีไฟล์ `llama-server.exe`

---

## 6. เพิ่ม preset ใหม่

แก้ตัวแปร `presets` ที่หัวไฟล์ [`scripts/my-local-ai/download-model.mjs`](../scripts/my-local-ai/download-model.mjs):

```js
const presets = {
  "ชื่อสั้นๆ": { repo: "owner/repo-GGUF", quant: "Q4_K_M" },
};
```

ก่อนใส่ ควรเช็คก่อนว่า repo นั้นมีไฟล์ quant ที่ต้องการจริง เปิดหน้า repo บน huggingface.co แล้วดูแท็บ **Files** หรือยิง API:

```bash
curl -s "https://huggingface.co/api/models/owner/repo-GGUF" | grep -o "[^\"]*Q4_K_M[^\"]*"
```

---

## 7. ตั้งค่าผ่าน .env

ทุก script อ่านไฟล์ `.env` ที่ root ของ repo ก๊อปตั้งต้นจาก [`.env.example`](../.env.example) ได้เลย

### ลำดับความสำคัญ

```
flag ที่พิมพ์หลัง --   >   env ที่ตั้งใน shell   >   ค่าใน .env   >   ค่า default
```

เช่นอยากลองเปลี่ยนพอร์ตครั้งเดียวโดยไม่แตะ `.env`:

```bash
$env:LLAMA_ARG_PORT=8081; pnpm my-local-ai:server
```

### เลือก model

| ตัวแปร            | ความหมาย                                                                |
| ----------------- | ----------------------------------------------------------------------- |
| `MODEL_PRESET`    | ชื่อโฟลเดอร์ใน `models\` — script จะหาไฟล์ `.gguf` ข้างในให้เอง          |
| `LLAMA_ARG_MODEL` | path เต็มของไฟล์ `.gguf` ถ้าตั้งอันนี้จะชนะ `MODEL_PRESET`               |

`MODEL_PRESET` ยังมีผลกับคำสั่งโหลดด้วย — สั่ง `pnpm my-local-ai:model` เปล่าๆ จะโหลดตัวที่ตั้งไว้ใน `.env`

> ถ้าโฟลเดอร์นั้นมีไฟล์ `.gguf` มากกว่า 1 ไฟล์ script จะไม่เดาให้ ต้องระบุ `LLAMA_ARG_MODEL` เป็น path เต็มเอง

### ตั้งค่า llama-server

พวก `LLAMA_ARG_*` เป็นตัวแปรของ llama.cpp เอง ไม่ใช่ของ script — llama-server อ่านตรงๆ ตัวที่ใช้บ่อย:

| ตัวแปร                   | ความหมาย                                          |
| ------------------------ | ------------------------------------------------- |
| `LLAMA_ARG_HOST`         | ip ที่ bind (default `127.0.0.1`)                 |
| `LLAMA_ARG_PORT`         | พอร์ต server (default `8080`)                     |
| `LLAMA_ARG_CTX_SIZE`     | ขนาด context เป็น token — ยิ่งเยอะยิ่งกิน RAM/VRAM |
| `LLAMA_ARG_N_GPU_LAYERS` | จำนวน layer ที่โยนขึ้น GPU (`99` = ทั้งหมด, `0` = CPU ล้วน) |
| `LLAMA_ARG_FLASH_ATTN`   | เปิด flash attention (`1` / `0`)                  |

ดูรายการเต็มทุกตัวได้จาก:

```bash
pnpm my-local-ai:server -- --help
```

ในหน้า help แต่ละ option จะมีบรรทัด `(env: LLAMA_ARG_...)` บอกชื่อตัวแปรกำกับไว้

### ตั้งค่าการโหลด model

| ตัวแปร     | ความหมาย                                                     |
| ---------- | ------------------------------------------------------------ |
| `HF_QUANT` | quant เริ่มต้นเวลาไม่ได้ใส่ `--quant` (default `Q4_K_M`)      |
| `HF_TOKEN` | token สำหรับ repo ที่ต้องขอสิทธิ์                             |
| `HF_CLI`   | path ของ `hf.exe` ใส่เฉพาะตอนที่หาไม่เจอเอง                   |

---

## 8. แก้ปัญหาที่เจอบ่อย

### `hf : The term 'hf' is not recognized...`

pip ติดตั้ง `hf.exe` ไว้ในโฟลเดอร์ Scripts ของ user ซึ่งมักไม่ได้อยู่ใน PATH บน Windows
**ไม่ต้องแก้อะไร** — ใช้ `pnpm my-local-ai:model` แทนการเรียก `hf` ตรงๆ script หา path ให้เอง

### `No module named 'huggingface_hub.commands'`

เป็นชื่อ module เก่าของ huggingface_hub v0.x ตั้งแต่ v1.0 ขึ้นไปย้ายไปเป็น `huggingface_hub.cli.hf` แล้ว
script ใช้ชื่อใหม่อยู่แล้ว ไม่ต้องแก้เอง

### `Could not find the Hugging Face CLI.`

แปลว่าหาไม่เจอจริงๆ ลองติดตั้งใหม่:

```bash
py -m pip install --upgrade huggingface_hub
```

ถ้ายังไม่ได้และรู้ path ของ `hf.exe` อยู่แล้ว ชี้ให้มันโดยตรงผ่าน env var:

```bash
$env:HF_CLI = "$env:APPDATA\Python\Python314\Scripts\hf.exe"
```

### โหลดค้าง / เน็ตหลุดกลางทาง

รันคำสั่งเดิมซ้ำได้เลย — มันจะ **resume ต่อจากของเดิม** ไม่ได้เริ่มใหม่หมด อย่าเพิ่งลบโฟลเดอร์ทิ้ง

### `401` หรือ repo ต้องขอสิทธิ์ (gated)

บาง repo (เช่นตระกูล Llama ต้นทาง) ต้องกดยอมรับ license บนเว็บก่อน แล้วค่อยใช้ token:

```bash
$env:HF_TOKEN = "hf_xxxxx"
```

แล้วรันคำสั่งโหลดตามปกติ script จะหยิบ `HF_TOKEN` ไปใช้เอง

### `No .gguf file matched ...`

ชื่อ quant ไม่ตรงกับไฟล์ใน repo นั้น เปิดแท็บ **Files** ของ repo ดูชื่อไฟล์จริง แล้วใช้ `--file` ระบุตรงๆ

### UI ขึ้น `No models` ทั้งที่ตั้ง `.env` แล้ว

สาเหตุที่เจอบ่อยที่สุดคือ **มี llama-server ตัวเก่าค้างอยู่และยังจองพอร์ต 8080 อยู่**
ตัวใหม่ที่เพิ่งสั่งรันจะ bind พอร์ตไม่ได้ ส่วนเบราว์เซอร์ก็ยังคุยกับตัวเก่าซึ่งไม่มี model โหลดไว้ → เลยขึ้น `No models`

เช็คว่าใครถือพอร์ตอยู่:

```bash
Get-Process llama-server | Select-Object Id,StartTime
```

ฆ่าตัวเก่าทิ้งแล้วรันใหม่:

```bash
Get-Process llama-server | Stop-Process -Force
```

ตอนนี้ script เช็คให้ก่อนแล้ว ถ้าพอร์ตไม่ว่างมันจะฟ้องทันทีแทนที่จะรันเงียบๆ

วิธีเช็คว่า server ที่ตอบอยู่โหลด model หรือยัง — ดูค่า `model_path` ถ้าได้ `none` หรือ `"role":"router"` แปลว่าไม่มี model:

```bash
Invoke-WebRequest http://127.0.0.1:8080/props -UseBasicParsing | Select-Object -ExpandProperty Content
```

### `MODEL_PRESET="xxx" but no .gguf file was found in ...`

ตั้งชื่อไว้ใน `.env` แล้วแต่ยังไม่ได้โหลดไฟล์ลงมา (หรือพิมพ์ชื่อโฟลเดอร์ผิด) โหลดก่อน:

```bash
pnpm my-local-ai:model
```

### `MODEL_PRESET="xxx" matches N .gguf files`

ในโฟลเดอร์นั้นมีหลาย quant ปนกัน script ไม่เดาให้ว่าจะเอาอันไหน — ไปตั้ง `LLAMA_ARG_MODEL` ใน `.env` เป็น path เต็มของไฟล์ที่ต้องการแทน หรือลบ quant ที่ไม่ใช้ทิ้ง

### แก้ `.env` แล้วไม่มีผล

เช็คว่าไม่ได้ตั้งตัวแปรชื่อเดียวกันค้างไว้ใน shell — ค่าใน shell ชนะค่าใน `.env` เสมอ ล้างด้วย:

```bash
Remove-Item Env:\LLAMA_ARG_MODEL
```

---

## การหา hf CLI

script ไล่หา `hf` ตามลำดับนี้:

1. ตัวแปร env `HF_CLI` (ถ้าตั้งไว้ ใช้ตัวนี้เลย)
2. `hf.exe` ใน PATH
3. `%APPDATA%\Python\Python*\Scripts\hf.exe` และ `%LOCALAPPDATA%\Programs\Python\*\Scripts\hf.exe`
4. fallback: `py -m huggingface_hub.cli.hf`

ถ้าทั้ง 4 ทางไม่เจอ ถึงจะขึ้น error พร้อมบอกวิธีติดตั้ง

---

## หมายเหตุ

- โฟลเดอร์ `models/` อยู่ใน `.gitignore` แล้ว ไฟล์ model จะไม่ถูก commit เข้า git
- ไฟล์ที่โหลดมาจะมีโฟลเดอร์ย่อย `.cache` ของ Hugging Face ปนอยู่ด้วย อย่าลบ — มันเก็บ metadata ไว้ใช้ resume และเช็คว่าไฟล์ครบ
