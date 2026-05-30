import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(root, "..");
const dist = resolve(root, "dist");
const esbuildBin = resolve(repoRoot, "node_modules/.pnpm/node_modules/.bin/esbuild");

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolveRun();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, "content"), { recursive: true });
await mkdir(resolve(dist, "background"), { recursive: true });

await run(esbuildBin, [
  resolve(root, "src/content/detect.ts"),
  "--bundle",
  "--format=iife",
  "--platform=browser",
  "--target=chrome120",
  "--sourcemap",
  `--outfile=${resolve(dist, "content/detect.js")}`,
]);

await run(esbuildBin, [
  resolve(root, "src/background/service-worker.ts"),
  "--bundle",
  "--format=esm",
  "--platform=browser",
  "--target=chrome120",
  "--sourcemap",
  `--outfile=${resolve(dist, "background/service-worker.js")}`,
]);

console.log("Built onecard-extension/dist");
