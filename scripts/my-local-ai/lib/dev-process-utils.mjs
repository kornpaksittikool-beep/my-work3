import { spawn } from "node:child_process";
import { StringDecoder } from "node:string_decoder";

function createPrefixedWriter(stream, label) {
  const decoder = new StringDecoder("utf8");
  let pending = "";

  function flushLine(line) {
    if (line.length === 0) {
      return;
    }

    stream.write(`[${label}] ${line}\n`);
  }

  function writeChunk(chunk) {
    pending += decoder.write(chunk).replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    const lines = pending.split("\n");
    pending = lines.pop() ?? "";

    for (const line of lines) {
      flushLine(line);
    }
  }

  function end() {
    pending += decoder.end().replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (pending.length > 0) {
      flushLine(pending);
      pending = "";
    }
  }

  return { writeChunk, end };
}

export function spawnLoggedChild(command, args, label, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    shell: false,
    stdio: ["inherit", "pipe", "pipe"],
    env: {
      ...process.env,
      ...options.env,
    },
  });

  const stdoutWriter = createPrefixedWriter(process.stdout, label);
  const stderrWriter = createPrefixedWriter(process.stderr, label);

  child.stdout.on("data", (chunk) => stdoutWriter.writeChunk(chunk));
  child.stderr.on("data", (chunk) => stderrWriter.writeChunk(chunk));
  child.stdout.on("end", () => stdoutWriter.end());
  child.stderr.on("end", () => stderrWriter.end());

  return child;
}
