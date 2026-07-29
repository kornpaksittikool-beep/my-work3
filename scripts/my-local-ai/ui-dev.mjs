import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { spawnLoggedChild } from "./lib/dev-process-utils.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const uiDir = join(rootDir, "my-local-ai", "tools", "ui");
const isWindows = process.platform === "win32";
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

function startPnpmExec(command, args, label, extraEnv = {}) {
  const child = isWindows
    ? spawnLoggedChild(
        process.env.ComSpec ?? "cmd.exe",
        ["/d", "/s", "/c", `pnpm exec ${command} ${args.join(" ")}`],
        label,
        { cwd: uiDir, env: extraEnv },
      )
    : spawnLoggedChild("pnpm", ["exec", command, ...args], label, { cwd: uiDir, env: extraEnv });

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
}

startPnpmExec("storybook", ["dev", "-p", "6006", "--ci"], "storybook");
startPnpmExec("vite", ["dev", "--host", "0.0.0.0"], "vite", {
  NODE_OPTIONS: [process.env.NODE_OPTIONS, "--insecure-http-parser"].filter(Boolean).join(" "),
});

process.on("SIGINT", () => stopChildren(0));
process.on("SIGTERM", () => stopChildren(0));
