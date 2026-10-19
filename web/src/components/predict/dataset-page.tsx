import { getRegistry } from "@/lib/registry";
import type { Manifest, RegistryEntry } from "@/types/manifest";

import { ComingSoon } from "./coming-soon";
import { DatasetHero } from "./dataset-hero";
import { Disclaimer } from "./disclaimer";
import { Predictor } from "./predictor";

/** One dataset tab: the live predictor when its models are exported, otherwise the coming-soon state. */
export function DatasetPage({ entry, manifest }: { entry: RegistryEntry; manifest: Manifest | null }) {
  if (!manifest) {
    const ready = getRegistry().find((d) => d.status === "ready");
    return <ComingSoon entry={entry} ready={ready} />;
  }
  return (
    <>
      <DatasetHero manifest={manifest} />
      <Predictor manifest={manifest} />
      <Disclaimer limitations={manifest.limitations} />
    </>
  );
}
