"use client";

import type { PredictionState } from "@/hooks/use-prediction";
import { outOfRange } from "@/lib/features";
import { capitalise, lowerFirst, numberWord, percent } from "@/lib/format";
import type { FeatureRow, Manifest } from "@/types/manifest";

import { ModelCard } from "./model-card";
import { RangeWarning } from "./range-warning";

function Verdict({ manifest, prediction }: { manifest: Manifest; prediction: PredictionState }) {
  const { target, models } = manifest;
  const results = prediction.results;
  if (results.length === 0) {
    return <h2 className="font-display text-3xl font-semibold tracking-tight">Loading the models</h2>;
  }

  const positives = results.filter((r) => r.positive).length;
  const all = models.length === 2 ? "Both" : `All ${numberWord(models.length)}`;
  const headline =
    positives === results.length
      ? `${all} models predict ${lowerFirst(target.positive)}`
      : positives === 0
        ? `${all} models predict ${lowerFirst(target.negative)}`
        : `The models disagree: ${positives} of ${results.length} predict ${lowerFirst(target.positive)}`;

  const recommended = models.find((m) => m.recommended);
  const lead = recommended && results.find((r) => r.id === recommended.id);

  return (
    <div aria-live="polite">
      <h2 className="font-display text-[clamp(1.75rem,3vw,2.4rem)] font-semibold leading-tight tracking-tight">{headline}</h2>
      <p className="mt-2 max-w-2xl leading-relaxed text-muted">
        {lead && recommended && (
          <>
            {recommended.name}, the recommended model, puts the chance of {lowerFirst(target.label)} at{" "}
            <span className="font-medium text-ink">{percent(lead.probability)}</span>.{" "}
          </>
        )}
        For comparison, {percent(target.prevalence, 1)} of participants in the data had it.
      </p>
    </div>
  );
}

export function ResultsPanel({ manifest, prediction, row }: { manifest: Manifest; prediction: PredictionState; row: FeatureRow }) {
  const issues = outOfRange(manifest, row);
  return (
    <section aria-label="Predictions" aria-busy={prediction.status === "loading"}>
      <Verdict manifest={manifest} prediction={prediction} />
      {issues.length > 0 && <RangeWarning issues={issues} />}
      {prediction.status === "error" && (
        <p role="alert" className="mt-4 rounded-xl border border-poor/40 bg-poor/10 p-3 text-sm">
          The models could not run ({prediction.error}). Reload the page to try again.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {manifest.models.map((model) => (
          <ModelCard
            key={model.id}
            manifest={manifest}
            model={model}
            result={prediction.results.find((r) => r.id === model.id)}
          />
        ))}
      </div>

      <p className="mt-5 text-sm leading-relaxed text-muted">
        {capitalise(manifest.evaluationNote ?? "")} Recommended is the simplest model whose F1 was not significantly
        lower than the best one; Highest F1 is the best cross-validated score.
      </p>
    </section>
  );
}
