import { cp, mkdir, copyFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(root, "../..");
const dist = resolve(root, "dist");
const optimizerEntry = resolve(repoRoot, "packages/optimizer/src/index.ts");

const sourceAliasPlugin = {
  name: "onecard-source-alias",
  setup(build) {
    build.onResolve({ filter: /^@onecard\/optimizer$/ }, () => ({
      path: optimizerEntry,
    }));
  },
};

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await mkdir(resolve(dist, "popup"), { recursive: true });
await mkdir(resolve(dist, "assets"), { recursive: true });

await Promise.all([
  copyFile(resolve(root, "src/manifest.json"), resolve(dist, "manifest.json")),
  copyFile(resolve(root, "src/popup/index.html"), resolve(dist, "popup/index.html")),
  cp(resolve(root, "src/assets"), resolve(dist, "assets"), { recursive: true }),
]);

await esbuild.build({
  entryPoints: {
    "content/content": resolve(root, "src/content/content.ts"),
    "popup/popup": resolve(root, "src/popup/popup.ts"),
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome120"],
  outdir: dist,
  sourcemap: true,
  plugins: [sourceAliasPlugin],
  logLevel: "info",
});
