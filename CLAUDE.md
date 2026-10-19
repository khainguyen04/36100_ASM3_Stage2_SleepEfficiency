# CLAUDE.md — Sleep Outcome Predictor (interactive app)

Working notes for this project. Read before doing any work. Stage 2 notes live in `/home/claude/CLAUDE.md`.

## Communication
- Reply to the user in **Vietnamese**; all app text (UI copy, docs, code comments) in **English**.
- The user asked to be consulted before large changes, and asked for the structure first, code later.

## Goal
A good-looking interactive web app where a user enters inputs and gets predictions from the group's
Stage 2 models (Logistic Regression, Decision Tree, Random Forest) for each of the 4 datasets.
UI reference: Magic UI (https://github.com/magicuidesign/magicui).

## Decisions (user answers, 17/10/2026)
| Question | Answer |
|---|---|
| Model runtime | **ONNX in the browser** (onnxruntime-web). `.keras` is not possible: the models are scikit-learn, not Keras. No backend server; static deploy (e.g. Vercel). |
| Teammates' models | **Khai first**; the app ships with empty, ready-to-fill slots for the other 3 datasets ("coming soon" state). |
| UX | **4 tabs, one per dataset**. Each tab: its own input form; results show LR, DT and RF side by side with F1 and an explanation. |
| Theme | **Magic UI dark + red/navy accents** (group colours: red #DA1311, royal blue #10468F, navy #031562). |

## Verified feasibility (17/10/2026)
- Khai's three tuned pipelines (imputer + scaler/one-hot + model) convert with skl2onnx 1.20.0 and run in onnxruntime 1.29.
- On the 90-row test set (13 rows with missing values): max |p_onnx − p_sklearn| ≤ 3.6e-07, labels 100% identical.
- Sizes: LR 2.9 KB, DT 3.5 KB, RF 61.9 KB.
- Required fix: the categorical `SimpleImputer(strategy="most_frequent")` must use a string sentinel
  (`missing_values=""`) for skl2onnx; categorical inputs are never missing in the UI (dropdowns), and the
  training data had no missing Gender/Smoking, so predictions do not change.
- ONNX renames inputs (spaces/brackets → `_`, e.g. `Time in Bed (h)` → `Time_in_Bed__h_`); the manifest stores both names.
- Network: npm and PyPI work; raw.githubusercontent.com works; magicui.design / shadcn registries and github.com pages are blocked
  → Magic UI and shadcn components are **vendored** (copied from raw GitHub into `web/src/components/`), which is how Magic UI is meant to be used anyway.
  Magic UI source path: `apps/www/registry/magicui/<name>.tsx` (uses `motion/react` and `@/lib/utils` `cn`).

## Architecture
```
ml/  (Python)  config.yaml + data  →  retrain locked pipelines  →  ONNX export  →  parity check  →  manifest.json
                                                                                         │
web/ (Next.js) public/models/<dataset>/{manifest.json, lr.onnx, dt.onnx, rf.onnx}  ←──────┘
               registry.json lists datasets + status (ready | pending)
               browser: form (from manifest) → adapter (derived features) → ONNX feeds → probabilities → threshold → cards
```
- **Retrain, don't unpickle:** `ml/` rebuilds each pipeline from the processed train data with the locked hyperparameters
  (deterministic, random_state = 42). This avoids scikit-learn pickle version problems; the parity check confirms the
  rebuilt models reproduce the reported CV/test metrics before export.
- **Adding a dataset = data + config only.** The form, cards and insights are generated from `manifest.json`.
  The only optional code is an adapter in `web/src/lib/adapters/` for derived features (e.g. time pickers → hours).
- **Thresholds live in the manifest**, not in ONNX: the app turns the probability into a class with the model's own
  threshold (default 0.5; Zhequan's LR uses 0.45).
- **Training ranges in the manifest:** each numeric input carries the training min/max; the UI warns when a value is outside it.
- Static export (`output: 'export'`); onnxruntime-web wasm files copied to `public/ort/` and served locally; single thread
  (no cross-origin isolation needed).

## Manifest contract (full spec: docs/manifest-spec.md, schema: schema/manifest.schema.json)
`id, title, owner{name, studentId}, source{name, citation, url}, n, target{label, definition, positive, citation, prevalence},
inputs[] (what the user sees), features[] (what ONNX receives), models[]{id: lr|dt|rf, file, threshold, params, metrics,
recommended, highestF1}, insights{lrCoefficients, rfImportances, dtRootSplit}, evaluationNote, limitations[]`

## Dataset slots
| Slug (ml/ + web/) | Owner | Status | Target | Inputs (from the Stage 2 report) |
|---|---|---|---|---|
| `sleep-efficiency` | Nguyen Minh Khai | **ready to build** | Sleep efficiency < 0.85 (Ohayon et al., 2017); 55.5% | Age, Gender, Smoking, Alcohol, Caffeine, Exercise, Bedtime + Wake-up time (→ Time in Bed, Bedtime h from midnight), Awakenings |
| `screen-stress` | Menghan Sun | pending | sleep_quality_score ≤ 5 (1–10); 25.07% | stress_level, daily_screen_time_hours, phone_usage_before_sleep_minutes, mental_fatigue_score |
| `sleep-lifestyle` | Jinyu Guo | pending | Sleep duration < 7 h (Watson et al., 2015); 41.44% | Age, Gender, Occupation, Physical Activity Level, Stress Level, BMI Category, Systolic BP, Diastolic BP, Heart Rate, Daily Steps |
| `nhanes-work` | Zhequan Fu | pending | Workday sleep < 7 h; 24.01% (n = 4,106) | OCQ180, OCQ215, RIDAGEYR, RIAGENDR, DMDEDUC2, INDFMPIR (LR threshold 0.45; class weights) |

Teammate specs above come from the report draft and must be confirmed with each teammate before building their slot.

## Khai reference results (must match the manifest; from /home/claude/CLAUDE.md)
| Model | Params | CV F1 | Test F1 | Test acc | Notes |
|---|---|---|---|---|---|
| LR | C = 1, L2 | 0.884 | 0.863 | 0.856 | **recommended** (simplest of the statistically tied models) |
| DT | entropy, depth 5, leaf 1 | 0.900 | 0.872 | 0.867 | highest F1 |
| RF | 100 trees, depth 4, max_features 0.5, leaf 5 | 0.885 | 0.854 | 0.856 | |
No pairwise difference significant after Holm correction. Awakenings dominates; without it F1 ≈ baseline (0.714).

## UI rules
- Show all three models side by side; mark "Recommended" and "Highest F1" separately (they differ for Khai).
- Always state what the target means for that dataset (efficiency vs quality vs short sleep are different outcomes).
- Show F1 (not "accuracy") as the headline metric, with the evaluation type (CV vs held-out test).
- Disclaimer on every tab: educational project, predictive association only, not medical advice.
- Never present a weak model as reliable (Zhequan's test F1 ≈ 0.36 must be shown as such).

## Working rules for Claude
- Project root: `/home/claude/sleep-outcome-predictor/`. Never write into `/home/claude/stage2`.
- Before exporting a dataset, the parity report (`ml/reports/<slug>.json`) must show ONNX = sklearn and the
  reference metrics above; the build fails otherwise.
- Vendor Magic UI files from raw GitHub (pin the commit in a comment at the top of each file).
- Test the app with `next build` (static export) and check every tab renders in a headless browser before delivering.

## Status (17/10/2026)
- Folder structure created; all code files are empty placeholders (user asked for structure first).
- Khai's processed data copied to `ml/datasets/sleep-efficiency/data/`.
- Next step (after user approval): write ml/ export for sleep-efficiency → then web/.
