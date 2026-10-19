import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource-variable/figtree";
import "./globals.css";

import type { Metadata, Viewport } from "next";

import { Background } from "@/components/layout/background";
import { DatasetTabs } from "@/components/layout/dataset-tabs";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getRegistry } from "@/lib/registry";

export const metadata: Metadata = {
  title: { default: "Sleep Outcome Predictor", template: "%s | Sleep Outcome Predictor" },
  description:
    "Try the Logistic Regression, Decision Tree and Random Forest models from UTS 36100 Group 6 on four sleep datasets. Everything runs in your browser.",
};

export const viewport: Viewport = { themeColor: "#070c26" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const datasets = getRegistry();
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh bg-night font-sans text-ink antialiased">
        <Background />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SiteHeader />
          <DatasetTabs datasets={datasets} />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
