// Reads registry.json and the manifests at build time (server only; never shipped to the browser).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { Manifest, RegistryEntry } from "@/types/manifest";

const MODELS_DIR = join(process.cwd(), "public", "models");

export function getRegistry(): RegistryEntry[] {
  const raw = JSON.parse(readFileSync(join(MODELS_DIR, "registry.json"), "utf8")) as {
    datasets: RegistryEntry[];
  };
  return [...raw.datasets].sort((a, b) => a.order - b.order);
}

export function getEntry(id: string): RegistryEntry | undefined {
  return getRegistry().find((entry) => entry.id === id);
}

/** The manifest of a ready dataset, or null while it is pending. */
export function getManifest(id: string): Manifest | null {
  const path = join(MODELS_DIR, id, "manifest.json");
  if (getEntry(id)?.status !== "ready" || !existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as Manifest;
}
