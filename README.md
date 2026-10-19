cd ~/Downloads/sleep-outcome-predictor

cat > README.md <<'EOF'
# Sleep Outcome Predictor

An interactive web app for **UTS 36100 Data Science for Innovation, Stage 2 (Group 6, Health)**.
You describe a typical night and day, and the group's three classifiers (Logistic Regression, Decision Tree and
Random Forest) estimate the chance of a poor sleep outcome. The app has one tab for each member's dataset and shows
the three models side by side, with their F1 scores and what each model relies on.

The models are the ones from each member's Stage 2 notebook, rebuilt with the same settings and exported to
**ONNX**. They run **inside the browser** with onnxruntime-web, so there is no server and nothing you type leaves
the page.

> Educational project. The predictions describe statistical associations in one dataset each. They are not causes,
> not a diagnosis and not medical advice.

## Contents

1. [Datasets and results](#datasets-and-results)
2. [How it works](#how-it-works)
3. [Project structure](#project-structure)
4. [Getting started](#getting-started)
5. [The ml/ pipeline](#the-ml-pipeline)
6. [The web app](#the-web-app)
7. [Adding a teammate's dataset](#adding-a-teammates-dataset)
8. [Deploying](#deploying)
9. [Troubleshooting](#troubleshooting)
10. [Limitations](#limitations)
11. [Credits and references](#credits-and-references)

## Datasets and results

| Tab | Owner | Outcome (positive class) | Status |
|---|---|---|---|
| Sleep Efficiency | Nguyen Minh Khai | Sleep efficiency below 0.85 (Ohayon et al., 2017); 55.5% of 452 people | **Live** |
| Screen Time & Stress | Menghan Sun | Sleep quality score of 5 or below on a 1 to 10 scale | **Live** |
| Sleep Health & Lifestyle | Jinyu Guo | Sleep duration under 7 hours (Watson et al., 2015); 41.4% of 374 records | **Live** |
| NHANES Work & Sleep | Zhequan Fu | Workday sleep under 7 hours | **Live**|

Every live tab reproduces the scores in its owner's Stage 2 report. The export stops if a rebuilt model drifts
from the report by more than 0.002.

**Sleep Efficiency (Khai):** 362 training and 90 test participants, 10 stratified group folds.

| Model | Settings | CV F1 | Test F1 | Test accuracy | Badge |
|---|---|---|---|---|---|
| Logistic Regression | C = 1, L2, liblinear | 0.884 | 0.863 | 0.856 | Recommended |
| Decision Tree | entropy, max depth 5, min leaf 1 | 0.900 | 0.872 | 0.867 | Highest F1 |
| Random Forest | 100 trees, max depth 4, max features 0.5, min leaf 5 | 0.885 | 0.854 | 0.856 | |

**Sleep Health & Lifestyle (Jinyu):** 295 training and 79 test records, 10 stratified group folds.

| Model | Settings | CV F1 | Test F1 | Test accuracy | Badge |
|---|---|---|---|---|---|
| Logistic Regression | C = 1, L1, liblinear | 0.934 | 0.962 | 0.975 | Recommended |
| Decision Tree | gini, max depth 3, min leaf 1 | 0.973 | 0.894 | 0.937 | |
| Random Forest | 100 trees, max depth 5, max features sqrt | 0.991 | 0.980 | 0.987 | Highest F1 |

**Recommended** follows the group report's rule. When paired tests (Holm-corrected) find no significant difference
between the models, the simplest of the tied models is recommended. **Highest F1** marks the best cross-validated F1.
In both live datasets no difference was significant, so Logistic Regression is recommended. Jinyu's own notebook
calls Random Forest the most promising; to show that instead, move `recommended: true` from `lr` to `rf` in her
`config.yaml` and export again.

## How it works

~~~
                     ml/  (Python, run on your machine)
 config.yaml ─┐
 train.csv    ├─► rebuild LR / DT / RF ─► check scores vs report ─► export ONNX ─► check ONNX = scikit-learn
 test.csv    ─┘                                                         │
                                                                        ▼
                     web/public/models/<dataset>/  lr.onnx  dt.onnx  rf.onnx  manifest.json
                     web/public/models/registry.json  (tabs and their status)
                                                                        │
                     web/  (Next.js static site, runs in the browser)    ▼
 form (built from manifest) ─► adapter (derived inputs) ─► ONNX tensors ─► probability ─► threshold ─► model cards
~~~

- **Rebuild, don't unpickle.** `ml/` trains each pipeline again from the processed data with the locked
  hyperparameters (random_state 42). This avoids scikit-learn pickle version problems, and the score check proves the
  rebuilt models are the reported ones.
- **One manifest per dataset.** `manifest.json` holds everything a tab needs: the form inputs, the ONNX inputs, each
  model's threshold and scores, and the insights. Adding a dataset needs data and a config file, not UI code.
- **Thresholds live in the manifest, not in ONNX.** ONNX returns probabilities; the app applies each model's own
  threshold (0.5 by default).

## Project structure

~~~
sleep-outcome-predictor/
├── README.md
├── .gitignore
├── schema/
│   └── manifest.schema.json        JSON Schema every manifest is validated against
├── ml/                             Python: rebuild, check and export the models
│   ├── requirements.txt
│   ├── export_all.py               entry point: exports every dataset whose config says status: ready
│   ├── common/
│   │   ├── pipelines.py            preprocessing + LR / DT / RF pipelines built from a config
│   │   ├── onnx_export.py          skl2onnx conversion (opset 17, probabilities as a plain tensor)
│   │   ├── parity.py               CV folds, metrics, ONNX vs scikit-learn comparison, report check
│   │   └── manifest.py             builds and validates manifest.json (inputs, ranges, metrics, insights)
│   ├── datasets/
│   │   ├── sleep-efficiency/       Khai: config.yaml + data/{train,test}.csv from the Stage 2 notebooks
│   │   ├── sleep-lifestyle/        Jinyu: config.yaml + prepare.py + data/raw/<Kaggle CSV>
│   │   ├── screen-stress/          Menghan: config.yaml (pending)
│   │   └── nhanes-work/            Zhequan: config.yaml (pending)
│   └── reports/                    <dataset>.json: rebuilt scores, ONNX difference, file sizes (generated)
└── web/                            Next.js static site
    ├── package.json                scripts: dev, build (runs check-models first), preview
    ├── next.config.ts              output: "export" (plain HTML/JS/CSS in web/out)
    ├── components.json             shadcn CLI settings (used to install Magic UI components)
    ├── scripts/
    │   ├── copy-ort-wasm.mjs       copies the onnxruntime-web WebAssembly files to public/ort (runs on npm install)
    │   └── check-models.mjs        fails the build if a ready dataset is missing its manifest or ONNX files
    ├── public/
    │   ├── ort/                    onnxruntime-web runtime (generated, not committed)
    │   └── models/                 registry.json + one folder per dataset (generated by ml/, committed)
    └── src/
        ├── app/
        │   ├── layout.tsx          fonts, dark theme, header, tabs, footer
        │   ├── globals.css         Tailwind v4 theme: night palette, slider styles, Magic UI tokens
        │   ├── page.tsx            home = the first live dataset
        │   └── [dataset]/page.tsx  one static page per registry entry
        ├── components/
        │   ├── layout/             background (starfield), site-header, dataset-tabs, site-footer
        │   ├── magicui/            7 Magic UI components (see "The web app")
        │   └── predict/            dataset-page, dataset-hero, predictor, prediction-form, field, night-strip,
        │                           results-panel, model-card, model-insight, range-warning, coming-soon, disclaimer
        ├── hooks/use-prediction.ts runs the models whenever the form changes
        ├── lib/
        │   ├── registry.ts         reads registry.json and manifests at build time
        │   ├── features.ts         form values -> feature row; range checks; readable feature names
        │   ├── onnx.ts             loads onnxruntime-web, caches sessions, runs one model
        │   ├── format.ts           number and text helpers
        │   ├── utils.ts            cn() class-name helper used by Magic UI
        │   └── adapters/           derived inputs per dataset (sleep-efficiency: time pickers -> hours)
        └── types/manifest.ts       TypeScript types for manifest.json and registry.json
~~~

## Getting started

You need **Python 3.10 or newer** and **Node.js 20.9 or newer** (Node 22 LTS recommended). The commands below are
for macOS with zsh; on Windows use `.venv\Scripts\activate` instead of `source .venv/bin/activate`.

### 1. Export the models (Python)

~~~bash
cd sleep-outcome-predictor
python3 -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt

# Jinyu's dataset: put the Kaggle file at ml/datasets/sleep-lifestyle/data/raw/Sleep_health_and_lifestyle_dataset.csv
python ml/datasets/sleep-lifestyle/prepare.py

python ml/export_all.py
~~~

A good run prints the rebuilt scores for each live dataset and ends with the registry:

~~~
[sleep-efficiency]
  lr: CV F1 0.884 | test F1 0.863 | ONNX diff 1.1e-07 | 2.9 KB
  dt: CV F1 0.900 | test F1 0.872 | ONNX diff 2.6e-08 | 3.5 KB
  rf: CV F1 0.885 | test F1 0.854 | ONNX diff 3.6e-07 | 61.9 KB

[sleep-lifestyle]
  lr: CV F1 0.934 | test F1 0.962 | ONNX diff 5.9e-08 | 3.6 KB
  dt: CV F1 0.973 | test F1 0.894 | ONNX diff 5.0e-09 | 3.7 KB
  rf: CV F1 0.991 | test F1 0.980 | ONNX diff 3.8e-07 | 63.7 KB

registry.json: sleep-efficiency (ready), screen-stress (pending), sleep-lifestyle (ready), nhanes-work (pending)
~~~

Use `python ml/export_all.py --only sleep-lifestyle` to export a single dataset.

### 2. Run the app (Node)

~~~bash
cd web
npm install          # also copies the onnxruntime-web runtime into public/ort
npm run dev          # http://localhost:3000
~~~

With the default answers, the Sleep Efficiency tab should show LR 26%, DT 18% and RF 22% ("All three models predict
good sleep"), and the Sleep Health & Lifestyle tab LR 3%, DT 0% and RF 0%.

Other commands:

~~~bash
npm run build        # checks the model files, then writes the static site to web/out
npm run preview      # serves web/out locally to test the built site
~~~

### 3. Magic UI components (only when they are missing)

The seven components in `web/src/components/magicui/` belong in the repository. Magic UI is copy-and-paste by
design, so a fresh clone does not need this step. To download them again:

~~~bash
cd web
npx --yes shadcn@latest add --yes --overwrite \
  https://magicui.design/r/particles.json \
  https://magicui.design/r/number-ticker.json \
  https://magicui.design/r/animated-circular-progress-bar.json \
  https://magicui.design/r/blur-fade.json \
  https://magicui.design/r/border-beam.json \
  https://magicui.design/r/animated-shiny-text.json \
  https://magicui.design/r/magic-card.json
mkdir -p src/components/magicui
for f in particles number-ticker animated-circular-progress-bar blur-fade border-beam animated-shiny-text magic-card; do
  mv -f "src/components/ui/$f.tsx" src/components/magicui/
done
rmdir src/components/ui 2>/dev/null
~~~

The CLI writes Magic UI files into `src/components/ui/` (they are registered as UI components), while the app
imports them from `src/components/magicui/`, hence the move.

## The ml/ pipeline

`python ml/export_all.py` reads every `ml/datasets/*/config.yaml` in `order` and, for each one with `status: ready`:

1. **Rebuilds the pipelines** (`common/pipelines.py`). Numeric columns get a median imputer, plus a StandardScaler
   for the models listed in `scale_for` (Logistic