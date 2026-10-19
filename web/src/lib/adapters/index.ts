// Adapters compute model features that are not typed in directly (manifest feature with from: "adapter").
// A dataset whose inputs map one-to-one to its features needs no adapter.
import type { FeatureRow, InputValues } from "@/types/manifest";

import { sleepEfficiencyAdapter } from "./sleep-efficiency";

export type Adapter = (values: InputValues) => FeatureRow;

const adapters: Record<string, Adapter> = {
  "sleep-efficiency": sleepEfficiencyAdapter,
};

export function getAdapter(datasetId: string): Adapter {
  return adapters[datasetId] ?? (() => ({}));
}
