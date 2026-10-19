# manifest.json specification

One `manifest.json` per dataset, written by `ml/common/manifest.py` into `web/public/models/<slug>/`.
The web app builds the whole tab from it, so adding a dataset needs no UI code.
The JSON Schema in `schema/manifest.schema.json` is the source of truth; this page explains each field.

## Top level

| Field | Type | Example (sleep-efficiency) | Used for |
|---|---|---|---|
| `id` | string (slug) | `"sleep-efficiency"` | URL `/sleep-efficiency`, folder name |
| `title` | string | `"Sleep Efficiency"` | tab label |
| `owner` | `{ name, studentId }` | `{ "Nguyen Minh Khai", "26629725" }` | tab subtitle, credits |
| `source` | `{ name, citation, url }` | Equilibrium (2023), Kaggle | dataset hero, footer |
| `n` | integer | `452` | dataset hero |
| `target` | object (below) | | what "positive" means |
| `inputs` | array (below) | | the form |
| `features` | array (below) | | the ONNX inputs |
| `models` | array (below) | | the result cards |
| `insights` | object (below) | | "why" panel |
| `evaluationNote` | string | `"10-fold stratified group CV on 362 training rows; held-out test set of 90 rows"` | under the cards |
| `limitations` | string[] | `["Awakenings almost determines the label at 85%", ...]` | info drawer |

## `target`

| Field | Example |
|---|---|
| `label` | `"Poor sleep efficiency"` |
| `definition` | `"Sleep efficiency below 0.85"` |
| `positive` | `"Poor sleep"` (class 1) / `negative`: `"Good sleep"` (class 0) |
| `citation` | `"Ohayon et al. (2017)"` |
| `prevalence` | `0.555` |

## `inputs[]` (what the user sees)

| Field | Notes |
|---|---|
| `key` | unique id in the form, e.g. `"alcohol"` |
| `label`, `help`, `unit` | UI text, e.g. "Alcohol (24 h before bed)", "standard drinks" |
| `control` | `slider` · `number` · `select` · `time` |
| `min`, `max`, `step`, `default` | for numeric controls |
| `options` | for `select`: `[{ "value": "Yes", "label": "Smoker" }, ...]` (value = training category) |
| `trainingRange` | `[min, max]` seen in training data → range warning |
| `optional` | `true` if the user may leave it empty (sent as NaN, imputed inside the model) |

## `features[]` (what ONNX receives, in order)

| Field | Notes |
|---|---|
| `name` | original column name, e.g. `"Time in Bed (h)"` |
| `onnxInput` | sanitised ONNX input name, e.g. `"Time_in_Bed__h_"` |
| `dtype` | `float32` or `string` |
| `from` | input `key` it copies from, or `"adapter"` when computed in `web/src/lib/adapters/<slug>.ts` |

## `models[]`

| Field | Example |
|---|---|
| `id` | `lr` · `dt` · `rf` |
| `name` | `"Logistic Regression"` |
| `file` | `"lr.onnx"` |
| `threshold` | `0.5` (Zhequan's LR: `0.45`) |
| `params` | `{ "C": 1, "penalty": "l2" }` |
| `metrics` | `{ "cvF1": 0.884, "cvF1Sd": 0.045, "testF1": 0.863, "testAccuracy": 0.856, "testPrecision": 0.911, "testRecall": 0.82 }` (null when not available) |
| `recommended` | `true` for the model the report recommends |
| `highestF1` | `true` for the model with the best primary score |

## `insights`

| Field | Example |
|---|---|
| `lrCoefficients` | `[{ "feature": "Awakenings", "coef": 4.061, "oddsRatio": 58.06 }, ...]` |
| `rfImportances` | `[{ "feature": "Awakenings", "importance": 0.763 }, ...]` |
| `dtRootSplit` | `{ "feature": "Awakenings", "threshold": 1.5, "informationGain": 0.497 }` |

## `registry.json`

```json
{ "datasets": [
  { "id": "sleep-efficiency", "title": "Sleep Efficiency", "owner": "Nguyen Minh Khai", "status": "ready" },
  { "id": "screen-stress",    "title": "Screen Time & Stress", "owner": "Menghan Sun", "status": "pending" },
  { "id": "sleep-lifestyle",  "title": "Sleep Health & Lifestyle", "owner": "Jinyu Guo", "status": "pending" },
  { "id": "nhanes-work",      "title": "NHANES Work & Sleep", "owner": "Zhequan Fu", "status": "pending" }
] }
```
