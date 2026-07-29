# Root workspace index

Use this index when you want to control `my-local-ai` from the workspace root with `pnpm`.

## Root entrypoints

| Path | Purpose |
| --- | --- |
| [`../package.json`](../package.json) | Root `pnpm` scripts for configure, build, test, server, unified dev, cli, app, and UI commands |
| [`../scripts/my-local-ai/runtime.mjs`](../scripts/my-local-ai/runtime.mjs) | Main runtime bridge for configure, build, test, server, cli, and app commands |
| [`../scripts/my-local-ai/dev.mjs`](../scripts/my-local-ai/dev.mjs) | Combined dev entrypoint that starts the UI dev processes and `llama-server` together |
| [`../scripts/my-local-ai/ui-dev.mjs`](../scripts/my-local-ai/ui-dev.mjs) | UI-only dev entrypoint that starts Vite and Storybook with prefixed logs |
| [`../scripts/my-local-ai/lib/dev-process-utils.mjs`](../scripts/my-local-ai/lib/dev-process-utils.mjs) | Shared process/logging helper for the long-running dev entrypoints |
| [`../pnpm-workspace.yaml`](../pnpm-workspace.yaml) | Workspace membership and pnpm policy for approved dependency build scripts |

## Commands from `D:\my-work-3`

```bash
pnpm install
pnpm run my-local-ai:configure
pnpm run my-local-ai:build -- --target llama-server -j 4
pnpm run my-local-ai:dev -- -m path\to\model.gguf
pnpm run my-local-ai:server -- --help
pnpm run my-local-ai:ui:dev
```

## Where these commands go

- CMake configure/build/test and runtime binaries target `my-local-ai/`
- UI commands target `my-local-ai/tools/ui/`
- `my-local-ai:dev` is the main combined entrypoint; it starts both the UI watcher and `llama-server`, and passes extra args through to `llama-server`
- `my-local-ai:ui:dev` is a process-only helper when you want just Vite + Storybook without the server
- `scripts/my-local-ai/lib/` contains shared helpers only; it is not meant to be called directly
- Combined dev logs are prefixed as `[server]`, `[vite]`, and `[storybook]`
- For actual inference, pass a model argument such as `-m path\to\model.gguf`; without it, `llama-server` starts in router mode on `http://127.0.0.1:8080`
- Subproject navigation docs live in [`../my-local-ai/.copilot/index.md`](../my-local-ai/.copilot/index.md)

## Related repo guides

1. [`../my-local-ai/.copilot/index.md`](../my-local-ai/.copilot/index.md)
2. [`../my-local-ai/.copilot/repo-map.md`](../my-local-ai/.copilot/repo-map.md)
3. [`../my-local-ai/.github/copilot-instructions.md`](../my-local-ai/.github/copilot-instructions.md)
