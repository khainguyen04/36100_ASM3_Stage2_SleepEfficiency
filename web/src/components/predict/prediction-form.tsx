"use client";

import { RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FeatureRow, InputSpec, InputValue, InputValues, Manifest } from "@/types/manifest";

import { Field } from "./field";
import { NightStrip } from "./night-strip";

interface Props {
  manifest: Manifest;
  values: InputValues;
  row: FeatureRow;
  onChange: (key: string, value: InputValue) => void;
  onReset: () => void;
  className?: string;
}

/** Inputs in manifest order, split into sections by their `group`. */
function groupInputs(inputs: InputSpec[]) {
  const groups: { name: string; inputs: InputSpec[] }[] = [];
  for (const input of inputs) {
    const name = input.group ?? "Your details";
    const group = groups.find((g) => g.name === name);
    if (group) group.inputs.push(input);
    else groups.push({ name, inputs: [input] });
  }
  return groups;
}

export function PredictionForm({ manifest, values, row, onChange, onReset, className }: Props) {
  return (
    <form
      className={cn("rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur-sm sm:p-7", className)}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Your answers</h2>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-panel-2 hover:text-ink"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Reset
        </button>
      </div>

      {groupInputs(manifest.inputs).map((group) => {
        const times = group.inputs.filter((input) => input.control === "time");
        const others = group.inputs.filter((input) => input.control !== "time");
        const headingId = `group-${group.name.replace(/\W+/g, "-").toLowerCase()}`;
        return (
          <div key={group.name} role="group" aria-labelledby={headingId} className="mt-7 border-t border-line pt-6">
            <h3 id={headingId} className="font-display text-lg font-semibold">
              {group.name}
            </h3>
            {times.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {times.map((input) => (
                  <Field key={input.key} input={input} value={values[input.key]} onChange={onChange} />
                ))}
              </div>
            )}
            {"bedtime" in values && "wakeup" in values && times.some((t) => t.key === "bedtime") && (
              <NightStrip manifest={manifest} values={values} row={row} />
            )}
            <div className="mt-5 space-y-6">
              {others.map((input) => (
                <Field key={input.key} input={input} value={values[input.key]} onChange={onChange} />
              ))}
            </div>
          </div>
        );
      })}
    </form>
  );
}
