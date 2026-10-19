// Form values -> the feature row ONNX expects, plus helpers for labels and range checks.
import type { FeatureRow, InputValues, Manifest } from "@/types/manifest";

import { getAdapter } from "./adapters";

export function defaultValues(manifest: Manifest): InputValues {
  return Object.fromEntries(manifest.inputs.map((input) => [input.key, input.default]));
}

/** "Not sure" (null) becomes NaN, which the pipeline's median imputer fills in, exactly as in training. */
export function buildFeatureRow(manifest: Manifest, values: InputValues): FeatureRow {
  const derived = getAdapter(manifest.id)(values);
  const row: FeatureRow = {};
  for (const feature of manifest.features) {
    const value = feature.from === "adapter" ? derived[feature.name] : values[feature.from];
    if (feature.dtype === "string") row[feature.name] = String(value ?? "");
    else row[feature.name] = value === null || value === undefined || value === "" ? Number.NaN : Number(value);
  }
  return row;
}

export interface RangeIssue {
  feature: string;
  value: number;
  range: [number, number];
}

/** Numeric features outside the range seen in training (the models extrapolate there). */
export function outOfRange(manifest: Manifest, row: FeatureRow): RangeIssue[] {
  return manifest.features.flatMap((feature) => {
    const value = row[feature.name];
    if (!feature.trainingRange || typeof value !== "number" || Number.isNaN(value)) return [];
    const [lo, hi] = feature.trainingRange;
    return value < lo || value > hi ? [{ feature: feature.name, value, range: feature.trainingRange }] : [];
  });
}

/** Readable name for a model feature, including one-hot columns such as "Smoking status_Yes". */
export function featureLabel(manifest: Manifest, name: string): string {
  const direct = manifest.inputs.find((input) => input.feature === name);
  if (direct) return direct.label;
  for (const input of manifest.inputs) {
    if (input.feature && name.startsWith(`${input.feature}_`)) {
      const level = name.slice(input.feature.length + 1);
      return input.options?.find((option) => option.value === level)?.label ?? `${input.label}: ${level}`;
    }
  }
  return name.replace(/\s*\(.*\)$/, ""); // derived features: "Time in Bed (h)" -> "Time in Bed"
}
