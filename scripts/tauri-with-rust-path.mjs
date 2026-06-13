import { accessSync, constants } from "node:fs";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";
import { error as logError } from "node:console";

const pathEntries = (process.env.PATH ?? "").split(delimiter).filter(Boolean);
const candidateDirs = [
  process.env.CARGO_HOME ? join(process.env.CARGO_HOME, "bin") : undefined,
  join(homedir(), ".cargo", "bin"),
  "/opt/homebrew/bin",
  "/usr/local/bin",
].filter(Boolean);

const extraPathEntries = candidateDirs.filter((dir) => {
  try {
    accessSync(join(dir, "cargo"), constants.X_OK);
    return !pathEntries.includes(dir);
  } catch {
    return false;
  }
});

const env = {
  ...process.env,
  PATH: [...extraPathEntries, ...pathEntries].join(delimiter),
};

const tauriBin =
  process.platform === "win32"
    ? join("node_modules", ".bin", "tauri.cmd")
    : join("node_modules", ".bin", "tauri");

const child = spawn(tauriBin, process.argv.slice(2), {
  stdio: "inherit",
  env,
});

child.on("error", (error) => {
  logError(error.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
