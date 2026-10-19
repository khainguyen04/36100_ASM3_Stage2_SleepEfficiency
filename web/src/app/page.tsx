// The home page shows the first dataset tab, so the app opens straight on a working predictor.
import { DatasetPage } from "@/components/predict/dataset-page";
import { getManifest, getRegistry } from "@/lib/registry";

export default function Home() {
  const first = getRegistry().find((entry) => entry.status === "ready") ?? getRegistry()[0];
  return <DatasetPage entry={first} manifest={getManifest(first.id)} />;
}
