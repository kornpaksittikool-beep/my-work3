# Copilot instructions for my-local-ai

Start with `.copilot/index.md` before making changes. That file is the repo index and points to the right subsystem docs and high-signal source paths.

Always read these first:
1. `AGENTS.md`
2. `CONTRIBUTING.md`
3. `.copilot/index.md`
4. `CMakeLists.txt`
5. `docs/build.md`

Repo shape:
- `src/` + `include/` contain the core `llama` library and public API.
- `ggml/` contains tensor runtime and backend implementations.
- `common/` contains shared CLI/server/test utilities.
- `tools/` contains production binaries such as `llama-cli`, `llama-server`, `llama-bench`, and `llama-quantize`.
- `app/` builds the unified `llama` binary.
- `conversion/`, `convert_*.py`, and `gguf-py/` contain Python conversion and GGUF tooling.
- `tests/` and `tools/server/tests/` contain validation coverage.

Editing guidance:
- Keep code comments sparse and only explain non-obvious invariants.
- Reuse existing helpers and target wiring before adding new files or abstractions.
- Touch the smallest subsystem that owns the behavior.
- If a change affects public behavior, update the nearest docs in `docs/`, `README.md`, or the relevant subsystem README.

Where to edit:
- Core inference logic: `src/`, `include/`
- Backend or performance work: `ggml/`
- Shared argument parsing, chat, sampling, downloads, templating: `common/`
- HTTP API or request lifecycle: `tools/server/`
- Embedded Web UI: `tools/ui/`
- Model import or GGUF conversion: `conversion/`, `convert_*.py`, `gguf-py/`
- Command-line tools: `tools/` and `app/`

When adding or changing tests:
- Prefer the nearest existing test target in `tests/` or `tools/server/tests/`.
- Keep validation scoped to the subsystem you changed.
