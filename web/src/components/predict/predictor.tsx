"use client";

import { useInView } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";

import { usePrediction, type PredictionState } from "@/hooks/use-prediction";
import { buildFeatureRow, defaultValues } from "@/lib/features";
import { percent } from "@/lib/format";
import type { InputValue, Manifest } from "@/types/manifest";

import { ModelInsight } from "./model-insight";
import { PredictionForm } from "./prediction-form";
import { ResultsPanel } from "./results-panel";

/** Phones only: the three probabilities stay in view while the form is being filled in. */
function MobileSummary({ manifest, prediction, hidden }: { manifest: Manifest; prediction: PredictionState; hidden: boolean }) {
  if (prediction.results.length === 0) return null;
  return (
    <a
      href="#results"
      aria-label="Jump to the predictions"
      className={`fixed inset-x-4 bottom-4 z-20 flex justify-around rounded-2xl border border-line bg-panel/95 px-3 py-2.5 shadow-lg shadow-night backdrop-blur transition-all duration-300 lg:hidden ${hidden ? "pointer-events-none translate-y-6 opacity-0" : ""}`}
    >
      {manifest.models.map((model) => {
        const result = prediction.results.find((r) => r.id === model.id);
        return (
          <span key={model.id} className="flex items-center gap-2 text-sm">
            <span className={`size-2.5 rounded-full ${result?.positive ? "bg-poor" : "bg-good"}`} />
            <span className="text-muted">{model.id.toUpperCase()}</span>
            <span className="font-display font-semibold tabular-nums">{result ? percent(result.probability) : "–"}</span>
          </span>
        );
      })}
    </a>
  );
}

/** Holds the form state; every change re-runs the three models in the browser. */
export function Predictor({ manifest }: { manifest: Manifest }) {
  const [values, setValues] = useState(() => defaultValues(manifest));
  const prediction = usePrediction(manifest, values);
  const row = useMemo(() => buildFeatureRow(manifest, values), [manifest, values]);
  const resultsRef = useRef<HTMLDivElement>(null);
  const resultsInView = useInView(resultsRef, { amount: 0.2 });

  const setValue = useCallback((key: string, value: InputValue) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  }, []);
  const reset = useCallback(() => setValues(defaultValues(manifest)), [manifest]);

  return (
    <>
      <div className="grid items-start gap-10 lg:grid-cols-12">
        <PredictionForm
          className="lg:col-span-5"
          manifest={manifest}
          values={values}
          row={row}
          onChange={setValue}
          onReset={reset}
        />
        <div id="results" ref={resultsRef} className="scroll-mt-6 lg:sticky lg:top-6 lg:col-span-7">
          <ResultsPanel manifest={manifest} prediction={prediction} row={row} />
        </div>
      </div>
      <ModelInsight manifest={manifest} row={row} />
      <MobileSummary manifest={manifest} prediction={prediction} hidden={resultsInView} />
    </>
  );
}
