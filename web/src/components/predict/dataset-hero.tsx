import { BlurFade } from "@/components/magicui/blur-fade";
import { capitalise, lowerFirst, numberWord, percent } from "@/lib/format";
import type { Manifest } from "@/types/manifest";

export function DatasetHero({ manifest }: { manifest: Manifest }) {
  const { target, source, owner, n, models } = manifest;
  const outcome = lowerFirst(target.label);
  const facts: { term: string; detail: React.ReactNode }[] = [
    { term: "Outcome", detail: `${target.definition}${target.citation ? `, following ${target.citation}` : ""}` },
    { term: "In the data", detail: `${percent(target.prevalence, 1)} of participants had ${outcome}` },
    {
      term: "Data",
      detail: source.url ? (
        <a href={source.url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-4 hover:decoration-ink">
          {source.name}
        </a>
      ) : (
        source.name
      ),
    },
    { term: "Models by", detail: owner.name },
  ];

  return (
    <section className="pb-10 pt-12 lg:pb-14 lg:pt-16">
      <BlurFade delay={0.05} direction="up" offset={10}>
        <h1 className="max-w-4xl font-display text-[clamp(2.6rem,6.5vw,5.25rem)] font-bold leading-[0.92] tracking-[-0.02em] [font-stretch:82%]">
          How likely is {outcome}?
        </h1>
      </BlurFade>
      <BlurFade delay={0.15} direction="up" offset={10}>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Fill in the form. {capitalise(numberWord(models.length))} models trained on {n.toLocaleString("en-AU")} people estimate the chance of{" "}
          {outcome} side by side, and show what each one relies on.
        </p>
      </BlurFade>
      <dl className="mt-10 grid gap-x-8 gap-y-5 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.term}>
            <dt className="text-sm text-muted">{fact.term}</dt>
            <dd className="mt-1 text-[0.95rem] leading-snug">{fact.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
