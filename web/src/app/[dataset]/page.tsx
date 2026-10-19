import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DatasetPage } from "@/components/predict/dataset-page";
import { getEntry, getManifest, getRegistry } from "@/lib/registry";

type Props = { params: Promise<{ dataset: string }> };

export const dynamicParams = false; // one static page per registry entry

export function generateStaticParams() {
  return getRegistry().map((entry) => ({ dataset: entry.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = getEntry((await params).dataset);
  return { title: entry ? `${entry.title} (${entry.owner})` : "Not found" };
}

export default async function DatasetRoute({ params }: Props) {
  const { dataset } = await params;
  const entry = getEntry(dataset);
  if (!entry) notFound();
  return <DatasetPage entry={entry} manifest={getManifest(dataset)} />;
}
