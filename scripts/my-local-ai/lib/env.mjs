import { existsSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const modelsDir = join(rootDir, "models");
export const envPath = join(rootDir, ".env");

let loaded = false;

// Reads the root .env into process.env. Variables already set in the shell win,
// which keeps one-off overrides like `$env:LLAMA_ARG_PORT=8081` working.
export function loadEnv() {
  if (loaded || !existsSync(envPath)) {
    loaded = true;
    return;
  }

  try {
    process.loadEnvFile(envPath);
  } catch (error) {
    console.error(`Could not read ${envPath}: ${error.message}`);
    process.exit(1);
  }

  loaded = true;
}

export function listGgufFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const found = [];

  for (const entry of readdirSync(dir)) {
    // Hugging Face keeps resume metadata in .cache, never a usable model.
    if (entry === ".cache") {
      continue;
    }

    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...listGgufFiles(full));
    } else if (entry.toLowerCase().endsWith(".gguf")) {
      found.push(full);
    }
  }

  return found;
}

export function resolveModelDir(name) {
  return isAbsolute(name) ? name : resolve(modelsDir, name);
}

// A server that is already listening keeps answering the UI, so a second one
// that cannot bind looks exactly like "nothing happened" from the browser.
export function isPortFree(host, port) {
  return new Promise((resolve) => {
    const probe = createServer();

    probe.once("error", (error) => resolve(error.code !== "EADDRINUSE"));
    probe.once("listening", () => probe.close(() => resolve(true)));
    probe.listen(port, host);
  });
}

// llama.cpp reads LLAMA_ARG_MODEL itself, so the only thing left to do is turn
// the friendlier MODEL_PRESET into a concrete path when no path was given.
export function applyModelPreset() {
  if (process.env.LLAMA_ARG_MODEL) {
    return process.env.LLAMA_ARG_MODEL;
  }

  const preset = process.env.MODEL_PRESET;
  if (!preset) {
    return undefined;
  }

  const dir = resolveModelDir(preset);
  const files = listGgufFiles(dir);

  if (files.length === 0) {
    console.error(`MODEL_PRESET="${preset}" but no .gguf file was found in ${dir}.`);
    console.error(`Download it first:  pnpm my-local-ai:model ${preset}`);
    process.exit(1);
  }

  if (files.length > 1) {
    console.error(`MODEL_PRESET="${preset}" matches ${files.length} .gguf files in ${dir}.`);
    console.error("Pick one by setting LLAMA_ARG_MODEL to its full path in .env.");
    process.exit(1);
  }

  process.env.LLAMA_ARG_MODEL = files[0];
  return files[0];
}
