// Khai's dataset: the two time pickers become the engineered features used in Stage 2.
import type { FeatureRow, InputValues } from "@/types/manifest";

/** "23:30" -> 23.5 */
export function clockHours(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h + (m || 0) / 60;
}

export function sleepEfficiencyAdapter(values: InputValues): FeatureRow {
  const bed = clockHours(String(values.bedtime));
  const wake = clockHours(String(values.wakeup));
  return {
    // bed -> wake interval, wrapping past midnight (Stage 2 repaired negative intervals with +24 h)
    "Time in Bed (h)": (wake - bed + 24) % 24 || 24,
    // clock hour, with evening times counted before midnight: 23:00 -> -1, 01:30 -> 1.5
    "Bedtime (h from midnight)": bed >= 12 ? bed - 24 : bed,
  };
}
