"use client";

import { useEffect, useState } from "react";

import { buildFeatureRow } from "@/lib/features";
import { predictProbability } from "@/lib/onnx";
import type { InputValues, Manifest, ModelResult } from "@/types/manifest";

export interface PredictionState {
  status: "loading" | "ready" | "error";
  results: ModelResult[];
  error?: string;
}

/** Runs every model of the dataset whenever the form changes (debounced while a slider is dragged). */
export function usePrediction(manifest: Manifest, values: InputValues): PredictionState {
  const [state, setState] = useState<PredictionState>({ status: "loading", results: [] });

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const row = buildFeatureRow(manifest, values);
        const results = await Promise.all(
          manifest.models.map(async (model) => {
            const probability = await predictProbability(`/models/${manifest.id}/${model.file}`, manifest.features, row);
            return { id: model.id, probability, positive: probability >= model.threshold };
          }),
        );
        if (!cancelled) setState({ status: "ready", results });
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error);
          setState((previous) => ({ ...previous, status: "error", error: message }));
        }
      }
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [manifest, values]);

  return state;
}
