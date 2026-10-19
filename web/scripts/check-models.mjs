// Runs before `npm run build`: stops the build if a dataset marked ready is missing files.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const models = join(root, "public", "models");
const problems = [];

const { datasets } = JSON.parse(readFileSync(join(models, "registry.json"), "utf8"));
for (const dataset of datasets.filter((d) => d.status === "ready")) {
  const manifestPath = join(models, dataset.id, "manifest.json");
  if (!existsSync(manifestPath)) {
    problems.push(`${dataset.id}: manifest.json missing (run python ml/export_all.py)`);
    continue;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const model of manifest.models) {
    if (!existsSync(join(models, dataset.id, model.file))) problems.push(`${dataset.id}: ${model.file} missing`);
  }
}
if (!existsSync(join(root, "public", "ort", "ort-wasm-simd-threaded.wasm"))) {
  problems.push("public/ort is empty (run npm install, which copies the onnxruntime files)");
}

if (problems.length) {
  console.error("check-models failed:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(`check-models: ${datasets.filter((d) => d.status === "ready").length} ready dataset(s) OK`);
