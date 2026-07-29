# Root workspace index

Use this index when you want to control `my-local-ai` from the workspace root with `pnpm`.

## Root entrypoints

| Path | Purpose |
| --- | --- |
| [`../package.json`](../package.json) | Root `pnpm` scripts for configure, build, test, server, cli, app, and UI commands |
| [`../scripts/my-local-ai.mjs`](../scripts/my-local-ai.mjs) | Bridge from root `pnpm` commands into CMake binaries and runtime commands |
| [`../pnpm-workspace.yaml`](../pnpm-workspace.yaml) | Workspace membership and pnpm policy for approved dependency build scripts |

## Commands from `D:\my-work-3`

```bash
pnpm install
pnpm run my-local-ai:configure
pnpm run my-local-ai:build -- --target llama-server -j 4
pnpm run my-local-ai:server -- --help
pnpm run my-local-ai:ui:dev
```

## Where these commands go

- CMake configure/build/test and runtime binaries target `my-local-ai/`
- UI commands target `my-local-ai/tools/ui/`
- Subproject navigation docs live in [`../my-local-ai/.copilot/index.md`](../my-local-ai/.copilot/index.md)

## Related repo guides

1. [`../my-local-ai/.copilot/index.md`](../my-local-ai/.copilot/index.md)
2. [`../my-local-ai/.copilot/repo-map.md`](../my-local-ai/.copilot/repo-map.md)
3. [`../my-local-ai/.github/copilot-instructions.md`](../my-local-ai/.github/copilot-instructions.md)
