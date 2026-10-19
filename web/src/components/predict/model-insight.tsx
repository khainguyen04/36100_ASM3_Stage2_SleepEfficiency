"use client";

import { featureLabel } from "@/lib/features";
import { lowerFirst, percent, trim } from "@/lib/format";
import type { FeatureRow, Manifest } from "@/types/manifest";

function Panel({ title, caption, children }: { title: string; caption: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-3xl border border-line bg-panel/60 p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-snug text-muted">{caption}</p>
      <div className="mt-5 flex-1">{children}</div>
    </div>
  );
}

/** Diverging bars of LR coefficients (log-odds), labelled with odds ratios. */
function OddsRatios({ manifest }: { manifest: Manifest }) {
  const rows = (manifest.insights.lrCoefficients ?? []).slice(0, 6);
  const max = Math.max(...rows.map((r) => Math.abs(r.coef)), 1e-9);
  return (
    <div>
      <ul className="space-y-2.5">
        {rows.map((r) => {
          const width = `${(Math.abs(r.coef) / max) * 50}%`;
          return (
            <li key={r.feature} className="grid grid-cols-[8.5rem_1fr_3.5rem] items-center gap-2 text-sm">
              <span className="truncate" title={r.feature}>
                {featureLabel(manifest, r.feature)}
              </span>
              <span className="relative h-3">
                <span className="absolute inset-y-[-3px] left-1/2 w-px bg-muted/50" />
                <span
                  className="absolute inset-y-0 rounded-[4px]"
                  style={
                    r.coef >= 0
                      ? { left: "50%", width, background: "var(--color-poor)" }
                      : { right: "50%", width, background: "var(--color-good)" }
                  }
                />
              </span>
              <span className="text-right tabular-nums text-muted">×{trim(r.oddsRatio, r.oddsRatio < 10 ? 2 : 1)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-poor" aria-hidden />
          Raises the odds
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-good" aria-hidden />
          Lowers the odds
        </span>
      </p>
    </div>
  );
}

/** The root question of the tree and which way the current answers send it. */
function RootSplit({ manifest, row }: { manifest: Manifest; row: FeatureRow }) {
  const root = manifest.insights.dtRootSplit;
  if (!root) return null;
  const label = featureLabel(manifest, root.feature);
  const value = row[root.feature];
  const known = typeof value === "number" && !Number.isNaN(value);
  const gain = root.criterion === "entropy" ? `${root.impurityDecrease.toFixed(3)} bits of information gain` : `Gini impurity falls by ${root.impurityDecrease.toFixed(3)}`;

  return (
    <div className="flex h-full flex-col">
      <p className="font-display text-3xl font-semibold leading-tight tracking-tight">
        {label} ≤ {trim(root.threshold, 2)}?
      </p>
      <p className="mt-2 text-sm text-muted">{gain}, the largest of any first question.</p>
      <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
        {["Yes", "No"].map((branch) => {
          const taken = known && (branch === "Yes") === value <= root.threshold;
          return (
            <div
              key={branch}
              className={`rounded-xl border px-3 py-2 transition-colors ${taken ? "border-ink bg-ink/10" : "border-line text-muted"}`}
            >
              <span className="font-medium">{branch}</span>
              {taken && <span className="block text-xs">Your answers go this way</span>}
            </div>
          );
        })}
      </div>
      {!known && typeof value === "number" && (
        <p className="mt-3 text-xs text-muted">With “Not sure”, the tree uses the typical value from training.</p>
      )}
    </div>
  );
}

/** Random Forest impurity-based importances, top five plus the rest. */
function Importances({ manifest }: { manifest: Manifest }) {
  const all = manifest.insights.rfImportances ?? [];
  const top = all.slice(0, 5);
  const rest = all.slice(5).reduce((sum, r) => sum + r.importance, 0);
  const rows = rest > 0 ? [...top, { feature: "Other inputs", importance: rest }] : top;
  const max = Math.max(...rows.map((r) => r.importance), 1e-9);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.feature} className="grid grid-cols-[8.5rem_1fr_3rem] items-center gap-2 text-sm">
          <span className="truncate">{r.feature === "Other inputs" ? r.feature : featureLabel(manifest, r.feature)}</span>
          <span className="h-3">
            <span className="block h-full rounded-r-[4px] bg-ink/70" style={{ width: `${(r.importance / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums text-muted">{percent(r.importance)}</span>
        </li>
      ))}
    </ul>
  );
}

/** One sentence that says whether the three models agree on their strongest input. */
function agreement(manifest: Manifest) {
  const { lrCoefficients, rfImportances, dtRootSplit } = manifest.insights;
  const tops = [lrCoefficients?.[0]?.feature, rfImportances?.[0]?.feature, dtRootSplit?.feature].filter(Boolean) as string[];
  if (tops.length > 1 && tops.every((t) => t === tops[0])) {
    return `All three models lean hardest on ${lowerFirst(featureLabel(manifest, tops[0]))}.`;
  }
  return "The models rank the inputs differently; compare the three panels.";
}

export function ModelInsight({ manifest, row }: { manifest: Manifest; row: FeatureRow }) {
  const { insights } = manifest;
  return (
    <section className="mt-16" aria-labelledby="insight-heading">
      <h2 id="insight-heading" className="font-display text-3xl font-semibold tracking-tight">
        What the models learned
      </h2>
      <p className="mt-2 max-w-2xl text-muted">{agreement(manifest)}</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {insights.lrCoefficients && (
          <Panel
            title="Logistic Regression"
            caption="Odds ratios for the strongest inputs. Numeric inputs are per one standard deviation."
          >
            <OddsRatios manifest={manifest} />
          </Panel>
        )}
        {insights.dtRootSplit && (
          <Panel title="Decision Tree" caption="The first question the tree asks everyone.">
            <RootSplit manifest={manifest} row={row} />
          </Panel>
        )}
        {insights.rfImportances && (
          <Panel title="Random Forest" caption="Share of the forest's splitting power that each input provides.">
            <Importances manifest={manifest} />
          </Panel>
        )}
      </div>
    </section>
  );
}
