"use client";

import { ShieldCheck, Trophy } from "lucide-react";

import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar";
import { BorderBeam } from "@/components/magicui/border-beam";
import { MagicCard } from "@/components/magicui/magic-card";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { featureLabel } from "@/lib/features";
import { lowerFirst, percent } from "@/lib/format";
import type { Manifest, ModelResult, ModelSpec } from "@/types/manifest";

const POOR = "#f2474c";
const GOOD = "#5b8cff";

/** One plain-language line on how each model type decides, filled in from its tuned settings. */
function howItDecides(manifest: Manifest, model: ModelSpec) {
  const p = model.params;
  if (model.id === "lr") {
    return `Gives every answer a weight and adds them up, so each one nudges the result.`;
  }
  if (model.id === "dt") {
    const root = manifest.insights.dtRootSplit;
    const first = root ? `, starting with ${lowerFirst(featureLabel(manifest, root.feature))}` : "";
    return `Asks up to ${p.max_depth ?? "unlimited"} yes or no questions${first}.`;
  }
  return `Averages ${p.n_estimators} trees, each up to ${p.max_depth ?? "unlimited"} questions deep and grown on a resampled set.`;
}

function Badge({ tone, children }: { tone: "brand" | "good"; children: React.ReactNode }) {
  return (
    <span
      className={
        tone === "brand"
          ? "inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium ring-1 ring-brand/50"
          : "inline-flex items-center gap-1 rounded-full bg-good/10 px-2 py-0.5 text-xs font-medium ring-1 ring-good/40"
      }
    >
      {children}
    </span>
  );
}

export function ModelCard({ manifest, model, result }: { manifest: Manifest; model: ModelSpec; result?: ModelResult }) {
  const { target } = manifest;
  const value = result ? Math.round(result.probability * 100) : 0;
  const color = result?.positive ? POOR : GOOD;
  const decision = result ? (result.positive ? target.positive : target.negative) : "Waiting";

  return (
    <MagicCard
      className="h-full rounded-2xl"
      gradientSize={260}
      gradientColor="#17245a"
      gradientOpacity={0.6}
      gradientFrom={color}
      gradientTo="#10468f"
    >
      <article className="relative flex h-full flex-col rounded-2xl p-5">
        <h3 className="font-display text-lg font-semibold leading-tight">{model.name}</h3>
        <div className="mt-2 flex min-h-6 flex-wrap gap-1.5">
          {model.recommended && (
            <Badge tone="brand">
              <ShieldCheck className="size-3.5" aria-hidden />
              Recommended
            </Badge>
          )}
          {model.highestF1 && (
            <Badge tone="good">
              <Trophy className="size-3.5" aria-hidden />
              Highest F1
            </Badge>
          )}
        </div>

        <div
          className="relative mx-auto mt-4 size-32"
          role="img"
          aria-label={result ? `${value}% chance of ${lowerFirst(target.label)}` : "Prediction loading"}
        >
          <AnimatedCircularProgressBar
            className="size-32 [&>span]:hidden"
            value={value}
            gaugePrimaryColor={color}
            gaugeSecondaryColor="rgba(140, 150, 190, 0.16)"
          />
          <div className="absolute inset-0 grid place-content-center text-center">
            <span className="font-display text-3xl font-semibold tabular-nums">
              <NumberTicker value={value} className="tracking-normal text-ink dark:text-ink" />%
            </span>
            <span className="text-xs text-muted">chance</span>
          </div>
        </div>

        <p className="mt-3 flex items-center justify-center gap-2 font-medium">
          <span className="size-2.5 rounded-full transition-colors" style={{ background: result ? color : "var(--color-line)" }} />
          {decision}
        </p>
        <p className="text-center text-xs text-muted">at a {percent(model.threshold)} threshold</p>

        <p className="mt-4 text-sm leading-relaxed text-muted">{howItDecides(manifest, model)}</p>

        <dl className="mt-auto space-y-1.5 border-t border-line pt-4 text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-muted">F1, cross-validated</dt>
            <dd className="font-display font-semibold tabular-nums">{model.metrics.cvF1.toFixed(3)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-muted">F1, held-out test</dt>
            <dd className="font-display font-semibold tabular-nums">{model.metrics.testF1.toFixed(3)}</dd>
          </div>
        </dl>

        {model.recommended && <BorderBeam size={110} duration={9} colorFrom={POOR} colorTo={GOOD} borderWidth={1.5} />}
      </article>
    </MagicCard>
  );
}
