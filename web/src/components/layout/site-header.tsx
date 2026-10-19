import Link from "next/link";

/** Crescent moon mark in the group red. */
function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
      <path d="M21.5 4.5a12 12 0 1 0 6 17.3A10 10 0 0 1 21.5 4.5Z" fill="var(--color-brand)" />
      <circle cx="24" cy="9" r="1.4" fill="var(--color-ink)" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-6">
      <Link href="/" className="flex items-center gap-3 rounded-md">
        <Mark />
        <span className="font-display text-xl font-semibold tracking-tight">Sleep Outcome Predictor</span>
      </Link>
      <p className="text-sm text-muted">UTS 36100 Data Science for Innovation, Group 6</p>
    </header>
  );
}
