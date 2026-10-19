// Shape of public/models/<dataset>/manifest.json and registry.json (written by ml/export_all.py).

export type ModelId = "lr" | "dt" | "rf";

export interface InputOption {
  value: string;
  label: string;
}

/** One control in the form. */
export interface InputSpec {
  key: string;
  group?: string;
  feature?: string; // model feature this input feeds directly (absent when an adapter uses it)
  label: string;
  help?: string;
  unit?: string;
  control: "slider" | "number" | "select" | "time";
  min?: number;
  max?: number;
  step?: number;
  default: number | string;
  optional?: boolean; // the user may answer "Not sure" (the model then fills in the training median)
  options?: InputOption[];
}

/** One ONNX input, in graph order. */
export interface FeatureSpec {
  name: string;
  onnxInput: string;
  dtype: "float32" | "string";
  from: string; // an input key, or "adapter"
  trainingRange?: [number, number];
  categories?: string[];
}

export interface ModelMetrics {
  cvF1: number;
  cvF1Sd: number;
  testF1: number;
  testAccuracy: number;
  testPrecision: number;
  testRecall: number;
}

export interface ModelSpec {
  id: ModelId;
  name: string;
  file: string;
  threshold: number;
  params: Record<string, string | number | null>;
  metrics: ModelMetrics;
  recommended: boolean;
  highestF1: boolean;
}

export interface Insights {
  lrCoefficients?: { feature: string; coef: number; oddsRatio: number }[];
  rfImportances?: { feature: string; importance: number }[];
  dtRootSplit?: { feature: string; threshold: number; criterion: string; impurityDecrease: number };
}

export interface Manifest {
  id: string;
  title: string;
  owner: { name: string; studentId?: string };
  source: { name: string; citation: string; url?: string };
  n: number;
  target: {
    label: string;
    definition: string;
    positive: string;
    negative: string;
    citation?: string;
    prevalence: number;
  };
  inputs: InputSpec[];
  features: FeatureSpec[];
  models: ModelSpec[];
  insights: Insights;
  evaluationNote?: string;
  limitations?: string[];
}

export interface RegistryEntry {
  id: string;
  order: number;
  title: string;
  owner: string;
  target: string;
  status: "ready" | "pending";
}

/** Form state: null means "Not sure". */
export type InputValue = number | string | null;
export type InputValues = Record<string, InputValue>;

/** Values handed to ONNX, keyed by feature name. */
export type FeatureRow = Record<string, number | string>;

export interface ModelResult {
  id: ModelId;
  probability: number; // P(positive class)
  positive: boolean; // probability >= the model's threshold
}
