import { TriangleAlert } from "lucide-react";

import type { RangeIssue } from "@/lib/features";
import { trim } from "@/lib/format";

/** Shown when a value falls outside what the models saw in training, where they can only extrapolate. */
export function RangeWarning({ issues }: { issues: RangeIssue[] }) {
  return (
    <div role="note" className="mt-4 flex gap-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
      <div>
        <p className="font-medium">Outside the training data</p>
        <ul className="mt-1 text-muted">
          {issues.map((issue) => (
            <li key={issue.feature}>
              {issue.feature}: {trim(issue.value)}, while training covered {trim(issue.range[0])} to {trim(issue.range[1])}.
            </li>
          ))}
        </ul>
        <p className="mt-1 text-muted">Treat these predictions as rough guesses.</p>
      </div>
    </div>
  );
}
