/**
 * Downloads a pre-built llama.cpp binary release (Vulkan, Windows x64) from
 * GitHub and extracts it into my-local-ai/build/bin so that runtime.mjs can
 * find llama-server.exe without requiring a local compile.
 *
 * Usage:
 *   pnpm my-local-ai:backend            # latest release, Vulkan (default)
 *   pnpm my-local-ai:backend -- --cuda  # latest release, CUDA
 *   pnpm my-local-ai:backend -- --tag b10176  # pin to specific release
 */

import { createWriteStream, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const projectDir = join(rootDir, "my-local-ai");
const buildDir = join(projectDir, "build");
const binDir = join(buildDir, "bin");

const args = process.argv.slice(2);
const useCuda = args.includes("--cuda");
const tagIndex = args.indexOf("--tag");
const pinnedTag = tagIndex >= 0 ? args[tagIndex + 1] : null;

const REPO = "ggml-org/llama.cpp";

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "llama-backend-downloader" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}

async function downloadFile(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": "llama-backend-downloader" }, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);

  const total = Number(res.headers.get("content-length") ?? 0);
  let received = 0;
  let lastPct = -1;

  const out = createWriteStream(dest);
  const reader = res.body.getReader();

  await new Promise((resolve, reject) => {
    out.on("error", reject);
    out.on("finish", resolve);

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          out.write(value);
          received += value.length;
          if (total > 0) {
            const pct = Math.floor((received / total) * 100);
            if (pct !== lastPct && pct % 10 === 0) {
              process.stdout.write(`\r  ${pct}% (${(received / 1_048_576).toFixed(1)} / ${(total / 1_048_576).toFixed(1)} MB)`);
              lastPct = pct;
            }
          }
        }
        out.end();
      } catch (err) {
        out.destroy(err);
        reject(err);
      }
    })();
  });

  process.stdout.write("\n");
}

async function extractZipInto(zipPath, destDir) {
  // Extract zip into a temp folder, then copy all files into destDir (merge).
  const { spawnSync } = await import("node:child_process");
  const tmpDir = `${destDir}.__tmp`;

  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });

  const result = spawnSync(
    "powershell",
    ["-NoProfile", "-Command", `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${tmpDir}' -Force`],
    { stdio: "inherit" },
  );

  if (result.status !== 0) throw new Error("Expand-Archive failed");

  // If the zip has a single top-level folder, flatten it.
  const entries = readdirSync(tmpDir);
  const srcDir = entries.length === 1 && statSync(join(tmpDir, entries[0])).isDirectory()
    ? join(tmpDir, entries[0])
    : tmpDir;

  // Copy all files from srcDir into destDir (merge, not replace).
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir)) {
    renameSync(join(srcDir, entry), join(destDir, entry));
  }

  rmSync(tmpDir, { recursive: true, force: true });
}

// Keep old extractZip for compatibility (replaces destDir entirely).
async function extractZip(zipPath, destDir) {
  const { spawnSync } = await import("node:child_process");
  const tmpDir = `${destDir}.__tmp`;

  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });

  const result = spawnSync(
    "powershell",
    ["-NoProfile", "-Command", `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${tmpDir}' -Force`],
    { stdio: "inherit" },
  );

  if (result.status !== 0) throw new Error("Expand-Archive failed");

  const entries = readdirSync(tmpDir);
  const topLevel = entries.length === 1 && statSync(join(tmpDir, entries[0])).isDirectory()
    ? join(tmpDir, entries[0])
    : tmpDir;

  if (existsSync(destDir)) rmSync(destDir, { recursive: true, force: true });
  renameSync(topLevel, destDir);
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
}

async function main() {
  // 1. Resolve the release tag
  let tag = pinnedTag;
  if (!tag) {
    console.log("Fetching latest llama.cpp release info…");
    const latest = await fetchJson(`https://api.github.com/repos/${REPO}/releases/latest`);
    tag = latest.tag_name;
  }
  console.log(`Release: ${tag}`);

  const release = await fetchJson(`https://api.github.com/repos/${REPO}/releases/tags/${tag}`);
  mkdirSync(buildDir, { recursive: true });

  // 2. Determine assets to download
  // CUDA build = binaries zip + cudart zip (runtime DLLs bundled so no CUDA Toolkit needed).
  // Vulkan build = single zip.
  const assetsToDownload = [];

  if (useCuda) {
    const binPattern = /^llama-.*win-cuda-12.*x64.*\.zip$/i;
    const rtPattern  = /^cudart-llama-.*win-cuda-12.*x64.*\.zip$/i;
    const binAsset = release.assets.find((a) => binPattern.test(a.name));
    const rtAsset  = release.assets.find((a) => rtPattern.test(a.name));

    if (!binAsset || !rtAsset) {
      const available = release.assets.map((a) => a.name).join("\n  ");
      throw new Error(`Could not find CUDA 12 Windows x64 assets in ${tag}.\n  Available:\n  ${available}`);
    }
    assetsToDownload.push({ asset: binAsset, label: "CUDA binaries" });
    assetsToDownload.push({ asset: rtAsset,  label: "CUDA runtime DLLs" });
  } else {
    const pattern = /win-vulkan.*x64.*\.zip$/i;
    const asset = release.assets.find((a) => pattern.test(a.name));
    if (!asset) {
      const available = release.assets.map((a) => a.name).join("\n  ");
      throw new Error(`No Vulkan Windows x64 asset in ${tag}.\n  Available:\n  ${available}`);
    }
    assetsToDownload.push({ asset, label: "Vulkan binaries" });
  }

  // 3. Download all assets
  for (const { asset, label } of assetsToDownload) {
    const zipPath = join(buildDir, asset.name);
    if (existsSync(zipPath)) {
      console.log(`${label}: already downloaded (${asset.name}), skipping.`);
    } else {
      console.log(`Downloading ${label}: ${asset.name} (${(asset.size / 1_048_576).toFixed(1)} MB)…`);
      await downloadFile(asset.browser_download_url, zipPath);
    }
  }

  // 4. Extract into build/bin — first asset owns the folder, subsequent ones merge into it
  if (existsSync(binDir)) rmSync(binDir, { recursive: true, force: true });
  mkdirSync(binDir, { recursive: true });

  for (const { asset, label } of assetsToDownload) {
    const zipPath = join(buildDir, asset.name);
    console.log(`Extracting ${label}…`);
    await extractZipInto(zipPath, binDir);
  }

  // 5. Verify
  const serverExe = join(binDir, "llama-server.exe");
  if (!existsSync(serverExe)) {
    throw new Error(`llama-server.exe not found in ${binDir} after extraction.`);
  }

  const backend = useCuda ? "CUDA" : "Vulkan";
  console.log(`\n✅ Done! ${backend} backend ready at:\n   ${serverExe}`);
  console.log(`\nRun the server with:\n   pnpm my-local-ai:server`);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
