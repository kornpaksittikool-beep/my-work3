import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { spawnLoggedChild } from "./lib/dev-process-utils.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const isWindows = process.platform === "win32";
const defaultServerArgs = hasExplicitToolFlag(process.argv.slice(2))
  ? []
  : ["--tools", "all"];

// Extra args are forwarded to llama-server, for example:
// pnpm run my-local-ai:dev -- -m path\to\model.gguf
const serverArgs = process.argv.slice(2);
const children = [];
let shuttingDown = false;

function stopChildren(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(exitCode), 250);
}

function watchChild(child, label) {
  children.push(child);

  child.on("error", (error) => {
    console.error(`[${label}] ${error.message}`);
    stopChildren(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      console.error(`[${label}] exited from signal ${signal}`);
      stopChildren(1);
      return;
    }

    stopChildren(code ?? 0);
  });

  return child;
}

function spawnServer(command, args, label) {
  return watchChild(
    spawnLoggedChild(command, args, label, {
      cwd: rootDir,
    }),
    label,
  );
}

function spawnPassthrough(command, args, label) {
  return watchChild(
    spawn(command, args, {
      cwd: rootDir,
      shell: false,
      stdio: "inherit",
    }),
    label,
  );
}

if (isWindows) {
  spawnPassthrough(process.execPath, [".\\scripts\\my-local-ai\\ui-dev.mjs"], "ui");
} else {
  spawnPassthrough(process.execPath, ["./scripts/my-local-ai/ui-dev.mjs"], "ui");
}

spawnServer(
  process.execPath,
  [".\\scripts\\my-local-ai\\runtime.mjs", "server", ...defaultServerArgs, ...serverArgs],
  "server",
);

process.on("SIGINT", () => stopChildren(0));
process.on("SIGTERM", () => stopChildren(0));

function hasExplicitToolFlag(args) {
  return args.some((arg) => {
    return arg === "--agent" || arg === "--no-agent" || arg === "--tools" || arg.startsWith("--tools=");
  });
}
