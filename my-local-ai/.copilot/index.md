# my-local-ai repo index

This folder is the navigation layer for future edits. Use it to find the right subsystem before changing code.

## Read in this order

1. [`../AGENTS.md`](../AGENTS.md)
2. [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
3. [`../README.md`](../README.md)
4. [`../CMakeLists.txt`](../CMakeLists.txt)
5. [`../docs/build.md`](../docs/build.md)
6. [`repo-map.md`](repo-map.md)

## Build and test entrypoints

- Configure: `cmake -B build`
- Build: `cmake --build build --config Release`
- Main switches: `LLAMA_BUILD_TESTS`, `LLAMA_BUILD_TOOLS`, `LLAMA_BUILD_EXAMPLES`, `LLAMA_BUILD_SERVER`, `LLAMA_BUILD_APP`, `LLAMA_BUILD_UI`
- Python tooling entrypoints live in [`../pyproject.toml`](../pyproject.toml)
- Server pytest docs live in [`../tools/server/tests/README.md`](../tools/server/tests/README.md)

## Where to go for common tasks

| Task | Start here | Notes |
| --- | --- | --- |
| Understand the whole product | [`../README.md`](../README.md) | User-facing overview, install paths, key binaries |
| Build options and platform backends | [`../docs/build.md`](../docs/build.md) | CPU, CUDA, SYCL, Vulkan, Metal, Windows notes |
| Top-level build graph | [`../CMakeLists.txt`](../CMakeLists.txt) | Enables/disables tests, tools, app, UI |
| Core inference library | [`../src/`](../src/) and [`../include/`](../include/) | `llama` library internals and public API |
| Runtime backends | [`../ggml/`](../ggml/) | Tensor core, device backends, low-level kernels |
| Shared utility layer | [`../common/`](../common/) | Args, chat, downloads, grammars, logging, sampling |
| HTTP server | [`../tools/server/`](../tools/server/) | OpenAI-compatible API, routing, queueing, streaming |
| Web UI | [`../tools/ui/`](../tools/ui/) | Svelte/Vite frontend embedded into the server |
| CLI and utility binaries | [`../tools/`](../tools/) and [`../app/`](../app/) | `llama-cli`, `llama-bench`, `llama-quantize`, unified app |
| Model conversion | [`../conversion/`](../conversion/), [`../convert_hf_to_gguf.py`](../convert_hf_to_gguf.py) | Python conversion path for external model formats |
| GGUF Python tooling | [`../gguf-py/`](../gguf-py/) | Metadata and inspection utilities around GGUF |
| Add new model support | [`../docs/development/HOWTO-add-model.md`](../docs/development/HOWTO-add-model.md) | Usually touches `src/`, `conversion/`, tests, docs |
| Tests | [`../tests/`](../tests/), [`../tools/server/tests/`](../tools/server/tests/) | CTest for C++, pytest for server |

## High-signal subsystem docs

- [`repo-map.md`](repo-map.md): detailed top-level directory and root-file map
- [`../tools/server/README-dev.md`](../tools/server/README-dev.md): server architecture and request lifecycle
- [`../docs/multimodal.md`](../docs/multimodal.md): multimodal behavior and integration notes
- [`../docs/development/HOWTO-add-model.md`](../docs/development/HOWTO-add-model.md): model onboarding path
- [`../ci/README.md`](../ci/README.md): local CI harness when a change needs broader validation

## Fast path by edit area

- Library internals: read `src/` target wiring, then the affected implementation file and matching header in `include/`
- Backend work: read `ggml/CMakeLists.txt`, `ggml/src/`, and the backend-specific doc under `docs/backend/`
- Server work: read `tools/server/README-dev.md`, then `tools/server/` source and `common/` helpers it uses
- UI work: read `tools/ui/package.json`, `tools/ui/src/`, and the embedding glue in `tools/ui/CMakeLists.txt`
- Conversion work: read the matching script in `conversion/` or root `convert_*.py`, then the related tests
