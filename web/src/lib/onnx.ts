// Runs the exported scikit-learn pipelines in the browser with onnxruntime-web (WebAssembly, one thread).
import type { InferenceSession, Tensor } from "onnxruntime-web";

import type { FeatureRow, FeatureSpec } from "@/types/manifest";

type Ort = typeof import("onnxruntime-web/wasm");

let ortPromise: Promise<Ort> | null = null;
const sessions = new Map<string, Promise<InferenceSession>>();
let queue: Promise<unknown> = Promise.resolve(); // one run at a time across all models

function loadOrt(): Promise<Ort> {
  ortPromise ??= import("onnxruntime-web/wasm").then((ort) => {
    ort.env.wasm.wasmPaths = "/ort/"; // copied there by scripts/copy-ort-wasm.mjs
    ort.env.wasm.numThreads = 1; // no SharedArrayBuffer, so no special server headers needed
    return ort;
  });
  return ortPromise;
}

function loadSession(ort: Ort, url: string): Promise<InferenceSession> {
  let session = sessions.get(url);
  if (!session) {
    session = ort.InferenceSession.create(url, { executionProviders: ["wasm"] });
    session.catch(() => sessions.delete(url)); // allow a retry after a failed download
    sessions.set(url, session);
  }
  return session;
}

/** P(positive class) for one row. Runs are queued so the WebAssembly backend never overlaps them. */
export async function predictProbability(url: string, features: FeatureSpec[], row: FeatureRow): Promise<number> {
  const ort = await loadOrt();
  const session = await loadSession(ort, url);

  const feeds: Record<string, Tensor> = {};
  for (const feature of features) {
    const value = row[feature.name];
    feeds[feature.onnxInput] =
      feature.dtype === "string"
        ? new ort.Tensor("string", [String(value)], [1, 1])
        : new ort.Tensor("float32", Float32Array.from([Number(value)]), [1, 1]);
  }

  const run = queue.then(() => session.run(feeds, ["probabilities"]));
  queue = run.catch(() => undefined);
  const output = await run;
  return (output.probabilities.data as Float32Array)[1];
}
