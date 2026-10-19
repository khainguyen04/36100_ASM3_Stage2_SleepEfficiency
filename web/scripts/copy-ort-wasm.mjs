// Copies the onnxruntime-web runtime (.wasm + loader .mjs) into public/ort so the browser
// loads it from our own site instead of a CDN. Runs automatically after `npm install`.
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "onnxruntime-web", "dist");
const dest = join(root, "public", "ort");
mkdirSync(dest, { recursive: true });

const files = readdirSync(src).filter((f) => /^ort-wasm-simd-threaded\.(wasm|mjs)$/.test(f));
for (const file of files) copyFileSync(join(src, file), join(dest, file));
console.log(`copy-ort-wasm: copied ${files.length} files to public/ort`);
