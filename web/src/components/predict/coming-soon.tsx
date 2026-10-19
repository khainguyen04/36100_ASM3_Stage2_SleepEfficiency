import Link from "next/link";

import type { RegistryEntry } from "@/types/manifest";

import { Disclaimer } from "./disclaimer";

/** A dataset tab whose models are not exported yet. */
export function ComingSoon({ entry, ready }: { entry: RegistryEntry; ready?: RegistryEntry }) {
  return (
    <>
      <section className="pb-6 pt-12 lg:pt-16">
        <h1 className="max-w-4xl font-display text-[clamp(2.6rem,6.5vw,5.25rem)] font-bold leading-[0.92] tracking-[-0.02em] [font-stretch:82%]">
          {entry.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          {entry.owner}&apos;s models will predict {entry.target.toLowerCase()}.
        </p>
      </section>

      <div className="grid gap-6 rounded-3xl border border-dashed border-line p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl font-semibold">The models are on the way</h2>
          <p className="mt-2 leading-relaxed text-muted">
            Once they are exported, this tab shows the same side-by-side predictions from Logistic Regression, a
            Decision Tree and a Random Forest.
          </p>
          {ready && (
            <Link
              href={`/${ready.id}/`}
              className="mt-5 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-medium text-night transition-opacity hover:opacity-90"
            >
              Try the {ready.title} models
            </Link>
          )}
        </div>
        <div className="flex gap-4" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="size-20 rounded-full border-[7px] border-line/70 sm:size-24" />
          ))}
        </div>
      </div>

      <Disclaimer />
    </>
  );
}
