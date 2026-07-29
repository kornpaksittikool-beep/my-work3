import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { delimiter, join, relative } from "node:path";

import { envPath, listGgufFiles, loadEnv, resolveModelDir, rootDir } from "./lib/env.mjs";

// Downloads GGUF weights from the Hugging Face Hub into models\<name> so the
// root pnpm entrypoints can serve them without any manual CLI wrangling.
loadEnv();

const isWindows = process.platform === "win32";
const exeExt = isWindows ? ".exe" : "";

// Short aliases for the models we actually use. `quant` is the default
// quantization; override it per download with --quant.
const presets = {
  "qwen-coder-1.5b": { repo: "bartowski/Qwen2.5-Coder-1.5B-Instruct-GGUF", quant: "Q4_K_M" },
  "qwen-coder-7b": { repo: "bartowski/Qwen2.5-Coder-7B-Instruct-GGUF", quant: "Q4_K_M" },
  "qwen-coder-14b": { repo: "bartowski/Qwen2.5-Coder-14B-Instruct-GGUF", quant: "Q4_K_M" },
  "qwen3-4b": { repo: "unsloth/Qwen3-4B-Instruct-2507-GGUF", quant: "Q4_K_M" },
  "qwen3-8b": { repo: "unsloth/Qwen3-8B-GGUF", quant: "Q4_K_M" },
  "llama-3.1-8b": { repo: "bartowski/Meta-Llama-3.1-8B-Instruct-GGUF", quant: "Q4_K_M" },
  "gemma-3-4b": { repo: "unsloth/gemma-3-4b-it-GGUF", quant: "Q4_K_M" },
};

const usage = `Usage: pnpm my-local-ai:model [preset|owner/repo] [options]

Reads .env for its defaults. With no model argument it downloads MODEL_PRESET.

Options:
  --list             List the built-in presets and exit.
  --quant <name>     Quantization to fetch, e.g. Q4_K_M, Q5_K_M, Q8_0. Default: $HF_QUANT or Q4_K_M.
  --file <pattern>   Exact file name or glob to fetch. Overrides --quant.
  --dir <name|path>  Target directory. A bare name lands in models\\<name>.
  --revision <rev>   Branch, tag or commit to download. Default: main.
  --token <token>    Hugging Face token for gated repos. Default: $HF_TOKEN.
  --set-env          Write MODEL_PRESET into .env so this becomes the model the server runs.

Examples:
  pnpm my-local-ai:model qwen-coder-7b --set-env
  pnpm my-local-ai:model qwen-coder-7b --quant Q5_K_M
  pnpm my-local-ai:model bartowski/Qwen2.5-Coder-3B-Instruct-GGUF --dir qwen-coder-3b`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const options = { positional: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--list" || arg === "-l") {
      options.list = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--set-env") {
      options.setEnv = true;
      continue;
    }

    const named = ["--quant", "--file", "--dir", "--revision", "--token"];
    const match = named.find((name) => arg === name || arg.startsWith(`${name}=`));

    if (match) {
      const value = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : argv[++index];
      if (!value) {
        fail(`Missing value for ${match}.\n\n${usage}`);
      }
      options[match.slice(2)] = value;
      continue;
    }

    if (arg.startsWith("-")) {
      fail(`Unknown option ${arg}.\n\n${usage}`);
    }

    options.positional.push(arg);
  }

  return options;
}

function findOnPath(name) {
  const dirs = (process.env.PATH ?? "").split(delimiter).filter(Boolean);
  const candidate = `${name}${exeExt}`;

  for (const dir of dirs) {
    const full = join(dir, candidate);
    if (existsSync(full)) {
      return full;
    }
  }

  return undefined;
}

function findInPythonScriptDirs(name) {
  // pip installs console scripts into per-user Scripts directories that are
  // frequently missing from PATH on Windows, so probe them directly.
  const roots = isWindows
    ? [
        join(process.env.APPDATA ?? "", "Python"),
        join(process.env.LOCALAPPDATA ?? "", "Programs", "Python"),
      ]
    : [join(process.env.HOME ?? "", ".local", "bin")];

  const candidates = [];

  for (const root of roots) {
    if (!root || !existsSync(root)) {
      continue;
    }

    if (!isWindows) {
      candidates.push(join(root, name));
      continue;
    }

    for (const entry of readdirSync(root)) {
      candidates.push(join(root, entry, "Scripts", `${name}${exeExt}`));
    }
  }

  return candidates.find((candidate) => existsSync(candidate));
}

function findPython() {
  const names = isWindows ? ["py", "python", "python3"] : ["python3", "python"];

  for (const name of names) {
    const binary = findOnPath(name) ?? name;
    const probe = spawnSync(binary, ["-c", "import huggingface_hub"], { stdio: "ignore", shell: false });
    if (probe.status === 0) {
      return binary;
    }
  }

  return undefined;
}

// Prefer the `hf` console script, then the per-user pip Scripts directories,
// then fall back to running the CLI module through Python itself.
function resolveHfCli() {
  const override = process.env.HF_CLI;
  if (override) {
    return { command: override, args: [] };
  }

  const binary = findOnPath("hf") ?? findInPythonScriptDirs("hf");
  if (binary) {
    return { command: binary, args: [] };
  }

  const python = findPython();
  if (python) {
    return { command: python, args: ["-m", "huggingface_hub.cli.hf"] };
  }

  fail(
    [
      "Could not find the Hugging Face CLI.",
      "Install it with:  py -m pip install --upgrade huggingface_hub",
      "Or point HF_CLI at an existing hf executable.",
    ].join("\n"),
  );
}

function formatSize(bytes) {
  return bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(2)} GB`
    : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

// Rewrites MODEL_PRESET in .env, keeping the rest of the file untouched.
function writeModelPreset(value) {
  const line = `MODEL_PRESET=${value}`;
  const current = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

  // [ \t] rather than \s so the match cannot swallow surrounding blank lines.
  const existing = /^[ \t]*MODEL_PRESET[ \t]*=.*$/m;

  if (existing.test(current)) {
    writeFileSync(envPath, current.replace(existing, line));
  } else {
    const separator = current.length === 0 || current.endsWith("\n") ? "" : "\n";
    writeFileSync(envPath, `${current}${separator}${line}\n`);
  }

  console.log(`\nSet ${line} in ${envPath}`);
}

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  console.log(usage);
  process.exit(0);
}

if (options.list) {
  console.log("Presets:\n");
  for (const [name, preset] of Object.entries(presets)) {
    console.log(`  ${name.padEnd(16)} ${preset.repo} (${preset.quant})`);
  }
  console.log(`\n${usage}`);
  process.exit(0);
}

const [positional, ...unexpected] = options.positional;
// No argument means "download whatever .env already points at".
const target = positional ?? process.env.MODEL_PRESET;

if (!target) {
  fail(`Missing model, and MODEL_PRESET is not set in .env.\n\n${usage}`);
}

if (unexpected.length > 0) {
  fail(`Unexpected argument ${unexpected[0]}.\n\n${usage}`);
}

const preset = presets[target];

if (!preset && !target.includes("/")) {
  fail(`Unknown preset "${target}". Run "pnpm my-local-ai:model --list" to see the available presets.`);
}

const repo = preset?.repo ?? target;
const quant = options.quant ?? process.env.HF_QUANT ?? preset?.quant ?? "Q4_K_M";
const pattern = options.file ?? `*${quant}.gguf`;
const dirName = options.dir ?? (preset ? target : repo.split("/").pop().replace(/-GGUF$/i, "").toLowerCase());
const targetDir = resolveModelDir(dirName);

const cli = resolveHfCli();
const args = [
  ...cli.args,
  "download",
  repo,
  "--include",
  pattern,
  "--local-dir",
  targetDir,
];

if (options.revision) {
  args.push("--revision", options.revision);
}

const token = options.token ?? process.env.HF_TOKEN;
if (token) {
  args.push("--token", token);
}

console.log(`Repo:     ${repo}`);
console.log(`Files:    ${pattern}`);
console.log(`Target:   ${targetDir}\n`);

const result = spawnSync(cli.command, args, {
  cwd: rootDir,
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  fail(result.error.message);
}

if (result.status !== 0) {
  // The download resumes from whatever already landed on disk, so a retry is
  // usually all that is needed after a dropped connection.
  console.error("\nDownload failed. Re-run the same command to resume where it stopped.");
  process.exit(result.status ?? 1);
}

const files = listGgufFiles(targetDir);

if (files.length === 0) {
  fail(`\nNo .gguf file matched "${pattern}" in ${repo}. Check the quantization name or pass --file.`);
}

console.log("\nDownloaded:");
for (const file of files) {
  console.log(`  ${file} (${formatSize(statSync(file).size)})`);
}

// Only a single-file directory can be pointed at by name; anything else needs
// an explicit path in LLAMA_ARG_MODEL.
const envValue = files.length === 1 ? relative(join(rootDir, "models"), targetDir) : undefined;

if (options.setEnv) {
  if (!envValue || envValue.startsWith("..")) {
    fail("\n--set-env needs exactly one .gguf inside models\\. Set LLAMA_ARG_MODEL in .env by hand instead.");
  }
  writeModelPreset(envValue);
  console.log("\nRun it with:\n  pnpm my-local-ai:dev");
} else if (process.env.MODEL_PRESET === envValue) {
  console.log("\nRun it with:\n  pnpm my-local-ai:dev");
} else {
  console.log(`\nRun it with:\n  pnpm my-local-ai:dev -- -m "${files[0]}"`);
  if (envValue && !envValue.startsWith("..")) {
    console.log(`\nOr make it the default:\n  pnpm my-local-ai:model ${target} --set-env`);
  }
}
