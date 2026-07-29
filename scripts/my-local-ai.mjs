import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Keep all root-level pnpm entrypoints pointing at the same checked-out repo.
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const projectDir = join(rootDir, "my-local-ai");
const buildDir = join(projectDir, "build");
const isWindows = process.platform === "win32";
const exeExt = isWindows ? ".exe" : "";

const [command, ...rawArgs] = process.argv.slice(2);
const passthroughIndex = rawArgs.indexOf("--");
const extraArgs = passthroughIndex >= 0 ? rawArgs.slice(passthroughIndex + 1) : rawArgs;

function run(bin, args, options = {}) {
  const result = spawnSync(bin, args, {
    cwd: options.cwd ?? rootDir,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

function resolveTool(name) {
  if (!isWindows) {
    return name;
  }

  // Prefer common Windows CMake install locations so root pnpm commands work
  // even when cmake/ctest are not present on PATH.
  const candidates = [
    join("C:\\Program Files\\CMake\\bin", `${name}.exe`),
    join("C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\Common7\\IDE\\CommonExtensions\\Microsoft\\CMake\\CMake\\bin", `${name}.exe`),
    join("C:\\Program Files\\Microsoft Visual Studio\\2022\\BuildTools\\Common7\\IDE\\CommonExtensions\\Microsoft\\CMake\\CMake\\bin", `${name}.exe`),
    join("C:\\Program Files (x86)\\Microsoft Visual Studio\\18\\BuildTools\\Common7\\IDE\\CommonExtensions\\Microsoft\\CMake\\CMake\\bin", `${name}.exe`),
    join("C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\\Common7\\IDE\\CommonExtensions\\Microsoft\\CMake\\CMake\\bin", `${name}.exe`),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? `${name}.exe`;
}

function findBinary(name) {
  // Probe the common output layouts produced by the default build directory and
  // the upstream preset-specific Windows directories.
  const candidates = [
    join(buildDir, "bin", `${name}${exeExt}`),
    join(buildDir, "bin", "Release", `${name}${exeExt}`),
    join(buildDir, "bin", "Debug", `${name}${exeExt}`),
    join(projectDir, "build-x64-windows-llvm-release", "bin", `${name}${exeExt}`),
    join(projectDir, "build-arm64-windows-llvm-release", "bin", `${name}${exeExt}`),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function runBuiltBinary(name) {
  const binary = findBinary(name);
  if (!binary) {
    console.error(`Could not find ${name}${exeExt}. Run "pnpm my-local-ai:configure" and "pnpm my-local-ai:build" first.`);
    process.exit(1);
  }

  run(binary, extraArgs, { cwd: projectDir });
}

switch (command) {
  case "configure":
    run(resolveTool("cmake"), ["-S", projectDir, "-B", buildDir, ...extraArgs], { cwd: rootDir });
    break;
  case "build":
    run(resolveTool("cmake"), ["--build", buildDir, "--config", "Release", ...extraArgs], { cwd: rootDir });
    break;
  case "test":
    run(resolveTool("ctest"), ["--test-dir", buildDir, "-C", "Release", ...extraArgs], { cwd: rootDir });
    break;
  case "server":
    runBuiltBinary("llama-server");
    break;
  case "cli":
    runBuiltBinary("llama-cli");
    break;
  case "app":
    runBuiltBinary("llama");
    break;
  default:
    console.error("Usage: node scripts\\my-local-ai.mjs <configure|build|test|server|cli|app> [-- extra args]");
    process.exit(1);
}
