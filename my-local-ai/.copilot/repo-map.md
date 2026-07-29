# my-local-ai repo map

This is a human-readable map of the repository so future code changes can start in the correct place.

## Important root files

| Path | Purpose |
| --- | --- |
| [`../AGENTS.md`](../AGENTS.md) | Project rules for contributors and coding agents |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Contribution process, testing expectations, and repo conventions |
| [`../README.md`](../README.md) | Product overview, install paths, and user-facing entrypoints |
| [`../CMakeLists.txt`](../CMakeLists.txt) | Top-level build graph and feature switches |
| [`../CMakePresets.json`](../CMakePresets.json) | Named build presets for common platforms and backends |
| [`../pyproject.toml`](../pyproject.toml) | Python package metadata and console scripts for conversion tooling |
| [`../requirements.txt`](../requirements.txt) | Aggregate Python dependency entrypoint |
| [`../Makefile`](../Makefile) | Minimal pointer back to the CMake-based build flow |
| [`../.pre-commit-config.yaml`](../.pre-commit-config.yaml) | Pre-commit hooks for formatting and lint-style checks |
| [`../build-xcframework.sh`](../build-xcframework.sh) | Apple XCFramework packaging helper |

## Top-level directories

| Path | What it is for |
| --- | --- |
| [`../.devops/`](../.devops/) | Container, packaging, and build environment assets used by CI/devops flows |
| [`../.gemini/`](../.gemini/) | Gemini-specific workspace settings that point back to repo guidance |
| [`../.github/`](../.github/) | GitHub workflows, templates, and automation configuration |
| [`../.pi/`](../.pi/) | Additional agent/system prompts and automation metadata |
| [`../app/`](../app/) | Unified `llama` application target that links multiple tool modules into one binary |
| [`../benches/`](../benches/) | Benchmark assets and machine-specific benchmark notes |
| [`../ci/`](../ci/) | Local and CI orchestration scripts for broad test/build runs |
| [`../cmake/`](../cmake/) | Shared CMake modules, helper logic, and packaging support |
| [`../common/`](../common/) | Shared utility layer for tools, server, tests, and chat/runtime helpers |
| [`../conversion/`](../conversion/) | Python modules for model-family-specific conversion into GGUF |
| [`../docs/`](../docs/) | Build, install, backend, development, and feature documentation |
| [`../examples/`](../examples/) | Example programs that demonstrate library usage patterns |
| [`../ggml/`](../ggml/) | Low-level tensor runtime, device backends, allocators, and kernels |
| [`../gguf-py/`](../gguf-py/) | Python package and utilities for reading, writing, and inspecting GGUF files |
| [`../grammars/`](../grammars/) | Sample GBNF grammars used for structured generation |
| [`../include/`](../include/) | Public C/C++ headers such as `llama.h` and `llama-cpp.h` |
| [`../licenses/`](../licenses/) | Third-party and bundled license texts |
| [`../media/`](../media/) | Images and media assets used by documentation or UI surfaces |
| [`../models/`](../models/) | Model fixtures, vocab assets, and small data used by tests/tools |
| [`../pocs/`](../pocs/) | Proof-of-concept binaries kept separate from core product paths |
| [`../requirements/`](../requirements/) | Split Python requirement sets by use case |
| [`../scripts/`](../scripts/) | Utility scripts for docs, builds, syncing, benchmarks, and assets |
| [`../skills/`](../skills/) | Reusable task guidance and workflows for supported agents |
| [`../src/`](../src/) | Core `llama` library implementation and model/runtime internals |
| [`../tests/`](../tests/) | C++ and shell-level regression coverage wired through CTest |
| [`../tools/`](../tools/) | First-class executables and libraries such as CLI, server, quantize, and bench |
| [`../vendor/`](../vendor/) | Vendored third-party libraries included in the build |

## Core libraries and binaries

| Target area | Path | What it owns |
| --- | --- | --- |
| Core inference library | [`../src/`](../src/) | Model loading, context, sampling, kv/cache, vocab, and runtime orchestration |
| Public API | [`../include/`](../include/) | Stable interfaces that downstream callers consume |
| Shared utility library | [`../common/`](../common/) | Arg parsing, chat helpers, downloads, schema-to-grammar, logging, subprocess support |
| Tensor/runtime backend | [`../ggml/`](../ggml/) | CPU/GPU backends and low-level tensor operations |
| Unified app | [`../app/`](../app/) | Builds the single `llama` binary |
| Server | [`../tools/server/`](../tools/server/) | HTTP interface, queueing, routing, streaming, and model management |
| CLI tools | [`../tools/`](../tools/) | `llama-cli`, `llama-bench`, `llama-quantize`, `tokenize`, `perplexity`, and related tools |
| Multimodal library | [`../tools/mtmd/`](../tools/mtmd/) | Media/model adapters and multimodal support helpers |
| Embedded Web UI | [`../tools/ui/`](../tools/ui/) | Frontend assets compiled into the server binary |

## Where edits usually land

| Change type | Typical paths |
| --- | --- |
| Public API change | `include/`, `src/`, tests, relevant docs |
| Core inference behavior | `src/`, `common/`, maybe `include/`, tests |
| Backend acceleration or device support | `ggml/`, backend docs, targeted tests |
| Server API or request handling | `tools/server/`, `common/`, server tests, possibly UI |
| Web UI behavior | `tools/ui/`, `tools/server/` when backend payloads change |
| Model conversion support | `conversion/`, `convert_*.py`, `gguf-py/`, tests, docs |
| New model family | `src/`, `conversion/`, `docs/development/HOWTO-add-model.md`, tests |
| Benchmarking or perf harness | `tools/llama-bench/`, `benches/`, `scripts/` |

## First files to read for major subsystems

| Subsystem | Start here |
| --- | --- |
| Core library | [`../src/CMakeLists.txt`](../src/CMakeLists.txt), then the matching source/header pair |
| Build graph | [`../CMakeLists.txt`](../CMakeLists.txt), [`../CMakePresets.json`](../CMakePresets.json) |
| Server | [`../tools/server/README-dev.md`](../tools/server/README-dev.md), [`../tools/server/CMakeLists.txt`](../tools/server/CMakeLists.txt) |
| UI | [`../tools/ui/package.json`](../tools/ui/package.json), [`../tools/ui/CMakeLists.txt`](../tools/ui/CMakeLists.txt) |
| Python conversion | [`../pyproject.toml`](../pyproject.toml), [`../convert_hf_to_gguf.py`](../convert_hf_to_gguf.py), [`../conversion/`](../conversion/) |
| Tests | [`../tests/CMakeLists.txt`](../tests/CMakeLists.txt), [`../tools/server/tests/README.md`](../tools/server/tests/README.md) |

## Practical notes

- The repo builds through CMake, not the root `Makefile`.
- `src/` is the main product path; `tools/` and `examples/` consume that library.
- `common/` is the shared glue layer. If a change is used by multiple tools, look there before creating a new helper.
- `ggml/` is effectively its own subsystem. Backend work should stay there unless the public `llama` layer must expose it.
- The server has both backend C++ logic and an embedded web frontend. API shape changes can require coordinated edits in `tools/server/` and `tools/ui/`.
