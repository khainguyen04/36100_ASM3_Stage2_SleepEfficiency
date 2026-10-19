"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { cn } from "@/lib/utils";
import type { RegistryEntry } from "@/types/manifest";

/** One tab per dataset, in registry order. "/" counts as the first ready dataset. */
export function DatasetTabs({ datasets }: { datasets: RegistryEntry[] }) {
  const pathname = usePathname();
  const slug = pathname.replaceAll("/", "") || (datasets.find((d) => d.status === "ready") ?? datasets[0])?.id;

  return (
    <nav aria-label="Datasets" className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
      {datasets.map((dataset) => {
        const active = dataset.id === slug;
        return (
          <Link
            key={dataset.id}
            href={`/${dataset.id}/`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex flex-col gap-1 bg-night/90 px-4 py-3 transition-colors hover:bg-panel focus-visible:z-10 sm:px-5 sm:py-4",
              active && "bg-panel",
            )}
          >
            <span
              className={cn(
                "absolute inset-x-0 top-0 h-0.5 bg-transparent transition-colors",
                active && "bg-brand",
              )}
            />
            <span className={cn("font-display text-base font-semibold sm:text-lg", active ? "text-ink" : "text-ink/80")}>
              {dataset.title}
            </span>
            <span className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
              {dataset.owner}
              {dataset.status === "pending" && (
                <AnimatedShinyText className="mx-0 text-xs text-muted/80"> </AnimatedShinyText>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
