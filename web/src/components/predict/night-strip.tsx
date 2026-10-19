"use client";

import { clockHours } from "@/lib/adapters/sleep-efficiency";
import { trim } from "@/lib/format";
import type { FeatureRow, InputValues, Manifest } from "@/types/manifest";

const START = 18; // the strip runs from 6 pm ...
const SPAN = 20; // ... to 2 pm the next day
const TICKS: [number, string][] = [
  [18, "6pm"], [21, "9pm"], [0, "12am"], [3, "3am"], [6, "6am"], [9, "9am"], [12, "12pm"],
];

const position = (clock: number) => Math.min(1, Math.max(0, ((clock - START + 24) % 24) / SPAN));

function bedtimeText(hoursFromMidnight: number) {
  if (hoursFromMidnight === 0) return "lights out at midnight";
  const amount = `${trim(Math.abs(hoursFromMidnight))} h`;
  return `lights out ${amount} ${hoursFromMidnight < 0 ? "before" : "after"} midnight`;
}

/** The night drawn to scale: time in bed, the bedtimes seen in training, and each awakening as a dot. */
export function NightStrip({ manifest, values, row }: { manifest: Manifest; values: InputValues; row: FeatureRow }) {
  const bed = position(clockHours(String(values.bedtime)));
  const wake = Math.max(bed, position(clockHours(String(values.wakeup))));
  const inBed = Number(row["Time in Bed (h)"]);
  const bedtime = Number(row["Bedtime (h from midnight)"]);
  const awakenings = typeof values.awakenings === "number" ? values.awakenings : 0;

  const range = manifest.features.find((f) => f.name === "Bedtime (h from midnight)")?.trainingRange;
  const band = range && { from: position((range[0] + 24) % 24), to: position((range[1] + 24) % 24) };

  const summary = `${trim(inBed)} h in bed, ${bedtimeText(bedtime)}`;

  return (
    <figure className="mt-5" aria-label={`${summary}, ${awakenings} awakenings`}>
      <div className="relative h-11 rounded-xl border border-line bg-night/70">
        {band && (
          <div
            className="absolute inset-y-0 bg-ink/[0.05] [background-image:repeating-linear-gradient(135deg,transparent_0_5px,rgba(238,241,250,0.06)_5px_6px)]"
            style={{ left: `${band.from * 100}%`, width: `${(band.to - band.from) * 100}%` }}
            title="Bedtimes seen in the training data"
          />
        )}
        <div
          className="absolute inset-y-2 rounded-lg bg-royal/70 ring-1 ring-good/50 transition-[left,width] duration-300"
          style={{ left: `${bed * 100}%`, width: `${(wake - bed) * 100}%` }}
        >
          {Array.from({ length: awakenings }, (_, i) => (
            <span
              key={i}
              className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-2 ring-night"
              style={{ left: `${((i + 1) / (awakenings + 1)) * 100}%` }}
            />
          ))}
        </div>
      </div>
      <div className="relative mt-1.5 h-4 text-[11px] text-muted" aria-hidden>
        {TICKS.map(([clock, label]) => (
          <span key={label} className="absolute -translate-x-1/2 first:translate-x-0" style={{ left: `${position(clock) * 100}%` }}>
            {label}
          </span>
        ))}
      </div>
      <figcaption className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
        <span>{summary}</span>
        {band && <span className="text-muted">Hatched: bedtimes seen in training</span>}
      </figcaption>
    </figure>
  );
}
