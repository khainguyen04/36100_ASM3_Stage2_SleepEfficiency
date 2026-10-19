import { Info } from "lucide-react";

/** Limitations of the dataset (when given) and the not-medical-advice note shown on every tab. */
export function Disclaimer({ limitations }: { limitations?: string[] }) {
  return (
    <section className="mt-16 grid gap-6 lg:grid-cols-12" aria-label="Limitations">
      {limitations && limitations.length > 0 && (
        <div className="lg:col-span-7">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Read with care</h2>
          <ul className="mt-5 space-y-3">
            {limitations.map((item) => (
              <li key={item} className="flex gap-3 leading-relaxed text-muted">
                <span className="mt-2.5 h-px w-3 shrink-0 bg-muted" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      <aside className="flex gap-3 self-end rounded-2xl border border-line bg-panel/60 p-5 text-sm leading-relaxed text-muted lg:col-span-5">
        <Info className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden />
        <p>
          <span className="font-medium text-ink">Not medical advice. </span>
          A student project for UTS 36100. The models describe patterns in one dataset; they cannot diagnose a sleep
          problem. If poor sleep keeps affecting your days, talk to a doctor.
        </p>
      </aside>
    </section>
  );
}
