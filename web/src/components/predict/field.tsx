"use client";

import { cn } from "@/lib/utils";
import type { InputSpec, InputValue } from "@/types/manifest";

interface Props {
  input: InputSpec;
  value: InputValue;
  onChange: (key: string, value: InputValue) => void;
}

function withUnit(value: number, unit?: string) {
  if (!unit) return String(value);
  const singular = value === 1 && unit.endsWith("s") ? unit.slice(0, -1) : unit; // 1 drinks -> 1 drink
  return `${value} ${singular}`;
}

/** "Not sure" sends a missing value; the model then uses the training median, as it did for gaps in the data. */
function NotSure({ input, value, onChange }: Props) {
  const unknown = value === null;
  return (
    <button
      type="button"
      aria-pressed={unknown}
      onClick={() => onChange(input.key, unknown ? input.default : null)}
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-0.5 text-xs transition-colors",
        unknown ? "border-ink bg-ink text-night" : "border-line text-muted hover:border-muted hover:text-ink",
      )}
    >
      Not sure
    </button>
  );
}

export function Field({ input, value, onChange }: Props) {
  const id = `field-${input.key}`;
  const helpId = input.help ? `${id}-help` : undefined;
  const help = input.help && (
    <p id={helpId} className="text-sm leading-snug text-muted">
      {input.help}
    </p>
  );

  if (input.control === "time") {
    return (
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {input.label}
        </label>
        <input
          id={id}
          type="time"
          required
          value={String(value ?? input.default)}
          aria-describedby={helpId}
          onChange={(event) => event.target.value && onChange(input.key, event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line bg-night/70 px-3 py-2.5 font-display text-xl tabular-nums transition-colors hover:border-muted"
        />
        <div className="mt-1.5">{help}</div>
      </div>
    );
  }

  if (input.control === "select") {
    const options = input.options ?? [];
    if (options.length > 3) {
      return (
        <div>
          <label htmlFor={id} className="font-medium">
            {input.label}
          </label>
          <select
            id={id}
            value={String(value ?? input.default)}
            aria-describedby={helpId}
            onChange={(event) => onChange(input.key, event.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-night/70 px-3 py-2.5"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="mt-1.5">{help}</div>
        </div>
      );
    }
    return (
      <fieldset aria-describedby={helpId}>
        <legend className="font-medium">{input.label}</legend>
        <div className="mt-2 grid auto-cols-fr grid-flow-col gap-1 rounded-xl border border-line bg-night/70 p-1">
          {options.map((option) => (
            <label key={option.value} className="relative cursor-pointer">
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(input.key, option.value)}
                className="peer sr-only"
              />
              <span className="block rounded-lg px-3 py-2 text-center text-sm text-muted transition-colors peer-checked:bg-ink peer-checked:font-medium peer-checked:text-night peer-focus-visible:outline-2 peer-focus-visible:outline-good hover:text-ink peer-checked:hover:text-night">
                {option.label}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-1.5">{help}</div>
      </fieldset>
    );
  }

  // slider or number
  const min = input.min ?? 0;
  const max = input.max ?? 100;
  const unknown = value === null;
  const current = unknown ? Number(input.default) : Number(value);
  const fill = `${((current - min) / (max - min || 1)) * 100}%`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-medium">
          {input.label}
        </label>
        <output htmlFor={id} className={cn("font-display text-lg tabular-nums", unknown && "text-muted")}>
          {unknown ? "Typical value" : withUnit(current, input.unit)}
        </output>
      </div>
      {input.control === "number" ? (
        <input
          id={id}
          type="number"
          min={input.min}
          max={input.max}
          step={input.step ?? 1}
          value={unknown ? "" : current}
          disabled={unknown}
          aria-describedby={helpId}
          onChange={(event) => event.target.value !== "" && onChange(input.key, Number(event.target.value))}
          className="mt-2 w-full rounded-xl border border-line bg-night/70 px-3 py-2.5 tabular-nums disabled:opacity-40"
        />
      ) : (
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={input.step ?? 1}
          value={current}
          disabled={unknown}
          aria-describedby={helpId}
          aria-valuetext={unknown ? "Not sure" : withUnit(current, input.unit)}
          onChange={(event) => onChange(input.key, Number(event.target.value))}
          className="range mt-2"
          style={{ "--fill": fill } as React.CSSProperties}
        />
      )}
      <div className="mt-1.5 flex items-start justify-between gap-3">
        {help ?? <span />}
        {input.optional && <NotSure input={input} value={value} onChange={onChange} />}
      </div>
    </div>
  );
}
