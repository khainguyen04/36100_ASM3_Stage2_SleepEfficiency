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

## Demo video

[![Sleep Outcome Predictor: 90-second demo](https://img.youtube.com/vi/yBfIcCvLMDw/hqdefault.jpg)](https://www.youtube.com/watch?v=yBfIcCvLMDw)

Watch on YouTube: https://www.youtube.com/watch?v=yBfIcCvLMDw (90 seconds). The video was recorded on 18 October 2026, when the Screen Time & Stress tab
was still a research preview. That tab has been live since 19 October 2026.

## Contents

1. [Demo video](#demo-video)
2. [Quick start: run the app](#quick-start-run-the-app)
3. [Full setup: rebuild and export the models](#full-setup-rebuild-and-export-the-models)
4. [Datasets and results](#datasets-and-results)
5. [How it works](#how-it-works)
6. [Project structure](#project-structure)
7. [The ml/ pipeline](#the-ml-pipeline)
8. [The web app](#the-web-app)
9. [Adding a teammate's dataset](#adding-a-teammates-dataset)
10. [Deploying](#deploying)
11. [Saving changes to GitHub](#saving-changes-to-github)
12. [Troubleshooting](#troubleshooting)
13. [Limitations](#limitations)
14. [Credits and references](#credits-and-references)

## Quick start: run the app

The trained models are already in `web/public/models/`, so the app runs **without Python**. You only need Git and
**Node.js 20.9 or newer** (Node 22 LTS recommended). The commands are for macOS with zsh.

**1. Check Node.**

~~~bash
node -v
~~~

If it prints `v18...` or says `command not found`, install Node 22 with nvm (once per computer):

~~~bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
nvm install 22
nvm alias default 22
node -v
~~~

**2. Get the code.**

~~~bash
gh repo clone khainguyen04/36100_ASM3_Stage2_SleepEfficiency
cd 36100_ASM3_Stage2_SleepEfficiency
~~~

Without the GitHub CLI, use `git clone https://github.com/khainguyen04/36100_ASM3_Stage2_SleepEfficiency.git` instead. If the repository is private, you
need to be signed in to an account that has access.

**3. Install and start.**

~~~bash
cd web
npm install          # also copies the onnxruntime-web runtime into public/ort
npm run dev          # open http://localhost:3000
~~~


To try a few changes: on Sleep Efficiency set awakenings to 2 (the three models jump to about 89%, 100% and 95%);
on Screen Time & Stress move stress level to 10 and mental fatigue to 8 (65%, 85% and 65%).

**4. Test the production build (optional).** This is the exact site that gets deployed.

~~~bash
npm run build        # checks the model files, then writes the static site to web/out
npm run preview      # serves web/out, usually at http://localhost:3000
~~~

Stop `npm run dev` first, or `preview` will pick another port and print it.

## Full setup: rebuild and export the models

Only needed when a model, a dataset or a `config.yaml` changes. You need **Python 3.10 or newer**. Run the commands
from the project folder (the one that contains `ml/` and `web/`).

**1. Create the Python environment (once).**

~~~bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r ml/requirements.txt
~~~

`.venv/` is your local environment. It stays on your computer and is never committed (see `.gitignore`); anyone
else recreates it with the same three commands. In a new terminal, run `source .venv/bin/activate` again before using
Python.

**2. Rebuild the data of the datasets that start from a raw Kaggle file.** The raw files are in the repository under
`ml/datasets/<slug>/data/raw/`. If one is missing, download it from Kaggle and save it there with the name below.

~~~bash
python ml/datasets/sleep-lifestyle/prepare.py   # needs data/raw/Sleep_health_and_lifestyle_dataset.csv
python ml/datasets/screen-stress/prepare.py     # needs data/raw/sleep_mobile_stress_dataset_15000.csv
~~~

Khai's `train.csv` and `test.csv` come from his Stage 2 notebooks and are already in `ml/datasets/sleep-efficiency/data/`.

**3. Export.**

~~~bash
python ml/export_all.py                          # every ready dataset
python ml/export_all.py --only screen-stress     # or a single one
~~~

A good run prints the rebuilt scores for each live dataset and ends with the registry:

~~~
[sleep-efficiency]
  lr: CV F1 0.884 | test F1 0.863 | ONNX diff 1.1e-07 | 2.9 KB
  dt: CV F1 0.900 | test F1 0.872 | ONNX diff 2.6e-08 | 3.5 KB
  rf: CV F1 0.885 | test F1 0.854 | ONNX diff 3.6e-07 | 61.9 KB

[screen-stress]
  lr: CV F1 0.762 | test F1 0.756 | ONNX diff 3.9e-07 | 0.9 KB
  dt: CV F1 0.772 | test F1 0.771 | ONNX diff 1.8e-08 | 1.5 KB
  rf: CV F1 0.773 | test F1 0.779 | ONNX diff 2.5e-07 | 448.2 KB

[sleep-lifestyle]
  lr: CV F1 0.934 | test F1 0.962 | ONNX diff 5.9e-08 | 3.6 KB
  dt: CV F1 0.973 | test F1 0.894 | ONNX diff 5.0e-09 | 3.7 KB
  rf: CV F1 0.991 | test F1 0.980 | ONNX diff 3.8e-07 | 63.7 KB

registry.json: sleep-efficiency (ready), screen-stress (ready), sleep-lifestyle (ready), nhanes-work (pending)
~~~

The last digit of an ONNX difference can vary between computers; anything below 1e-5 passes.

**4. Rebuild the site** so it picks up the new files:

~~~bash
cd web
npm run build
npm run preview
~~~

**Magic UI components (only if they are missing).** The seven components in `web/src/components/magicui/` belong in
the repository. Magic UI is copy-and-paste by design, so a fresh clone does not need this step. To download them again:

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

## Datasets and results

| Tab | Owner | Outcome (positive class) | Status |
|---|---|---|---|
| Sleep Efficiency | Nguyen Minh Khai | Sleep efficiency below 0.85 (Ohayon et al., 2017); 55.5% of 452 people | **Live** |
| Screen Time & Stress | Menghan Sun | Sleep quality score of 5 or below on a 1 to 10 scale (Rood et al., 2019); 25.1% of 15,000 records | **Live** |
| Sleep Health & Lifestyle | Jinyu Guo | Sleep duration under 7 hours (Watson et al., 2015); 41.4% of 374 records | **Live** |
| NHANES Work & Sleep | Zhequan Fu | Workday sleep under 7 hours | Coming soon |

Every live tab reproduces the scores in its owner's Stage 2 report. The export stops if a rebuilt model drifts
from the report by more than 0.002.

**Sleep Efficiency (Khai):** 362 training and 90 test participants, 10 stratified group folds.

| Model | Settings | CV F1 | Test F1 | Test accuracy | Badge |
|---|---|---|---|---|---|
| Logistic Regression | C = 1, L2, liblinear | 0.884 | 0.863 | 0.856 | Recommended |
| Decision Tree | entropy, max depth 5, min leaf 1 | 0.900 | 0.872 | 0.867 | Highest F1 |
| Random Forest | 100 trees, max depth 4, max features 0.5, min leaf 5 | 0.885 | 0.854 | 0.856 | |

**Screen Time & Stress (Menghan):** 12,000 training and 3,000 test records, 10 stratified folds.

| Model | Settings | CV F1 | Test F1 | Test accuracy | Badge |
|---|---|---|---|---|---|
| Logistic Regression | C = 1, L2, saga | 0.762 | 0.756 | 0.875 | |
| Decision Tree | gini, max depth 3, min leaf 5 | 0.772 | 0.771 | 0.881 | Recommended |
| Random Forest | 200 trees, max depth 5, max features sqrt | 0.773 | 0.779 | 0.886 | Highest F1 |

**Sleep Health & Lifestyle (Jinyu):** 295 training and 79 test records, 10 stratified group folds.

| Model | Settings | CV F1 | Test F1 | Test accuracy | Badge |
|---|---|---|---|---|---|
| Logistic Regression | C = 1, L1, liblinear | 0.934 | 0.962 | 0.975 | Recommended |
| Decision Tree | gini, max depth 3, min leaf 1 | 0.973 | 0.894 | 0.937 | |
| Random Forest | 100 trees, max depth 5, max features sqrt | 0.991 | 0.980 | 0.987 | Highest F1 |

**Recommended** follows the group report's rule. When paired tests (Holm-corrected) find no significant difference
between the models, the simplest of the tied models is recommended. **Highest F1** marks the best cross-validated F1.
For Khai and Jinyu no difference was significant, so Logistic Regression is recommended. For Menghan, Random Forest
beats Logistic Regression significantly but not the Decision Tree, so the Decision Tree is recommended. Jinyu and
Menghan both chose Random Forest in their own notebooks; to show that instead, move `recommended: true` to `rf` in
their `config.yaml` and export again. Menghan's CV F1 is the 10-fold score of her selected settings (her Table 15);
her nested cross-validation (Table 6) gives 0.761, 0.769 and 0.773.

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
36100_ASM3_Stage2_SleepEfficiency/   (local folder may be called sleep-outcome-predictor)
├── README.md
├── .gitignore                       keeps .venv, node_modules and build output out of Git
├── .gitattributes                   line-ending settings (created by GitHub)
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
│   │   ├── screen-stress/          Menghan: config.yaml + prepare.py + data/raw/<Kaggle CSV>
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

## The ml/ pipeline

`python ml/export_all.py` reads every `ml/datasets/*/config.yaml` in `order` and, for each one with `status: ready`:

1. **Rebuilds the pipelines** (`common/pipelines.py`). Numeric columns get a median imputer, plus a StandardScaler
   for the models listed in `scale_for` (Logistic Regression). Categorical columns get a most-frequent imputer and
   a one-hot encoder configured by `onehot`. The model gets the config's `params` and `random_state = 42`. On
   scikit-learn 1.8 and newer, `penalty: l1 | l2` is translated to `l1_ratio: 1 | 0`.
2. **Scores them** (`common/parity.py`). CV F1 uses the fold numbers in the data's `cv_fold_column`, so the folds are
   exactly the owner's. Without that column it falls back to StratifiedKFold(10, shuffle, random_state 42). Each
   model is then fitted on the full training set and scored on the test set at its threshold.
3. **Checks the scores against the report** (`reference` in the config). If any CV or test F1 differs by more than
   `tolerance` (default 0.002), no manifest is written, the tab stays pending and the script exits with an error.
4. **Exports ONNX** (`common/onnx_export.py`) with skl2onnx, opset 17, one `[N, 1]` input per column (float32 or
   string) and the probabilities as a plain tensor. Input names are sanitised by ONNX (for example
   `Time in Bed (h)` becomes `Time_in_Bed__h_`); the manifest stores both names. skl2onnx needs a string sentinel
   for the categorical imputer, so it is set to `""` before export. Dropdowns are never empty, so no prediction
   changes.
5. **Checks ONNX against scikit-learn** on every test row. The largest probability difference must stay below 1e-5
   (it is about 1e-7 in practice).
6. **Writes the outputs.** `web/public/models/<slug>/manifest.json` (validated against `schema/manifest.schema.json`),
   the three `.onnx` files, `ml/reports/<slug>.json`, and finally `web/public/models/registry.json`.

### Dataset notes

**sleep-efficiency (Khai).** `data/train.csv` and `test.csv` come straight from the Stage 2 project
(`02_Preprocessing`), with missing values left as NaN and a `cv_fold` column. The form asks for bedtime and wake-up
time; the adapter in `web/src/lib/adapters/sleep-efficiency.ts` turns them into the two engineered features:
`Time in Bed (h)` (wake minus bed, wrapping past midnight) and `Bedtime (h from midnight)` (23:00 becomes -1,
01:30 becomes 1.5). Awakenings, alcohol, caffeine and exercise can be answered "Not sure".

**sleep-lifestyle (Jinyu).** `prepare.py` rebuilds the data from the Kaggle CSV exactly as her notebook does. It
merges "Normal Weight" into "Normal", splits blood pressure into systolic and diastolic, sets the target to
Sleep Duration < 7, groups identical predictor profiles and applies GroupShuffleSplit (test size 0.2, random state 42).
Her ten folds were made with StratifiedGroupKFold(shuffle=True), which shuffles differently after scikit-learn 1.6,
so the fold of every training row is stored in the script. It checks the fold sizes against her table
(30, 17, 30, 46, 38, 24, 19, 37, 19, 35). The one-hot encoder keeps every category (`handle_unknown: ignore`, no
drop), as in her notebook. "Manager" appears only in the test set, so it is not offered in the Occupation list.
Blood pressure and heart rate can be answered "Not sure".

**screen-stress (Menghan).** `prepare.py` rebuilds the data from the Kaggle CSV as her notebook does: target
`sleep_quality_score <= 5`, the four predictors she chose in Stage 1 (stress level, daily screen time, phone use
before sleep, mental fatigue) and a stratified 80/20 split with random state 42. Her folds are
StratifiedKFold(10, shuffle, random_state 42) on the training rows, which is the parity fallback, so no fold
column is needed. All four inputs are sliders; the data has no missing values.

## The web app

**Stack:** Next.js 16 (static export), React 19, TypeScript, Tailwind CSS v4, Magic UI with motion,
onnxruntime-web 1.30, lucide-react icons, Bricolage Grotesque and Figtree fonts.

**One tab per dataset.** `registry.json` lists the tabs in `order`. A ready dataset gets the full predictor; a
pending one shows a "coming soon" page that links to a live tab. Pages are generated at build time from the
registry, so a new dataset appears after `npm run build` with no code change.

**What a live tab shows**

- A headline built from the target ("How likely is short sleep?") and the facts behind it: definition and citation,
  prevalence, data source and owner.
- The form, generated from `inputs` in the manifest and split into sections by `group`. Sliders, two- or
  three-option segmented buttons, dropdowns for longer lists, and time pickers. Optional inputs have a "Not sure"
  button. It sends a missing value, which the model's own median imputer fills in.
- For Khai's dataset, a strip that draws the night to scale: time in bed, the bedtimes seen in training (hatched) and
  one dot per awakening.
- The verdict ("All three models predict good sleep" or "The models disagree: 2 of 3 predict short sleep"), led by the
  recommended model's probability and the dataset's base rate.
- Three model cards side by side: a probability ring, the decision at the model's threshold, a one-line description
  of how the model decides, and its cross-validated and held-out test F1. The recommended card has a moving border.
- A warning when any input, including derived ones, falls outside the range seen in training.
- "What the models learned": Logistic Regression odds ratios (diverging bars), the Decision Tree's first question
  with the branch your answers take, and the Random Forest's top importances.
- The dataset's limitations and the not-medical-advice note.

**How predictions run.** `lib/onnx.ts` imports `onnxruntime-web/wasm` only in the browser, sets the runtime path to
`/ort/` and uses one thread (no special server headers needed). Each model file is loaded once and cached; runs are
queued so they never overlap. `hooks/use-prediction.ts` re-runs the three models 120 ms after the last change. The
first visit downloads the WebAssembly runtime (about 14 MB, cached by the browser); each model is 1 to 450 KB.

**Magic UI components used:** Particles (starfield), BlurFade (headline entrance), AnimatedShinyText ("Coming soon"),
MagicCard (model cards), AnimatedCircularProgressBar and NumberTicker (probability rings), BorderBeam (recommended
model). For people who ask their system for reduced motion, the starfield is hidden and CSS animations are cut short.

**Accessibility.** Every control has a label, keyboard focus is visible, the verdict is announced politely to
screen readers, each ring has a text label, colour is never the only signal (text and icons accompany it), and the
layout adapts to phone screens. On phones a small bar keeps the three probabilities in view while you fill in the form.


## Deploying

The build is a folder of static files (`web/out`), so any static host works.

- **Vercel:** import the repository, set **Root Directory** to `web` and keep the Next.js defaults. Vercel only
  runs the Node build, so commit `web/public/models/` (the ONNX files and manifests); `public/ort` is recreated by
  `npm install`.
- **Netlify:** base directory `web`, build command `npm run build`, publish directory `web/out`.
- Host the site at the root of a domain. The app loads `/models/...` and `/ort/...` with absolute paths, so a
  sub-path such as `username.github.io/repo/` would need a Next.js `basePath` and matching changes in `lib/onnx.ts`
  and `hooks/use-prediction.ts`.

## Saving changes to GitHub

The repository is `khainguyen04/36100_ASM3_Stage2_SleepEfficiency`. `.gitignore` keeps out everything that is machine-specific or rebuilt:
`.venv/`, `web/node_modules/`, `web/.next/`, `web/out/`, the onnxruntime files in `web/public/ort/` and Python
caches. Commit the generated `web/public/models/` folder, because the deployed site needs it.

~~~bash
git status                     # see what changed
git add -A
git commit -m "Describe the change"
git push
~~~

GitHub Desktop works too: the changes appear under **Changes**; commit, then **Push origin**.

**First push from a new computer.** Sign the terminal in once with the GitHub CLI:

~~~bash
brew install gh                # if `gh --version` fails
gh auth login                  # GitHub.com, HTTPS, Yes, Login with a web browser
gh auth setup-git
~~~

The one-time code for the browser page is printed in the Terminal (for example `ABCD-1234`), not in the GitHub
mobile app.

## Troubleshooting

| Problem | Fix |
|---|---|
| `You are using Node.js 18...` or `npm run dev` says Node.js 20.9 or newer is required | Load Node 22: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22`. To make new terminals use it, add those two nvm lines to `~/.zshrc` and run `nvm alias default 22`. |
| `npm run preview` shows a 404 page | The build did not finish, so `web/out` is missing or old. Read the output of `npm run build`, fix the error (often the Node version) and build again. |
| `zsh: command not found: pip` or `python` | Use `python3 -m venv .venv` then `source .venv/bin/activate`; inside the venv `pip` and `python` work. |
| `ModuleNotFoundError: No module named 'sklearn'` (or `yaml`, `skl2onnx`) | The venv is not active or not installed. Run `source .venv/bin/activate` and `pip install -r ml/requirements.txt`. |
| `FileNotFoundError ... data/raw/...csv` when running `prepare.py` | Put the Kaggle file in that folder with the exact name shown in "Full setup", step 2. |
| `check-models failed: public/ort is empty` | Run `npm install` in `web/` (its postinstall copies the runtime). |
| `Module not found: Can't resolve '@/components/magicui/...'` | The shadcn CLI saved the files in `src/components/ui/`. Move them (see "Magic UI components" in Full setup). |
| `zsh: no matches found: src/app/[dataset]/page.tsx` | zsh reads brackets as a pattern. Quote the path: `'src/app/[dataset]/page.tsx'`. |
| Export prints `PROBLEM: lr cvF1: expected ..., got ...` | The rebuilt model differs from the report. Check the feature order, the params, the one-hot settings and the folds. The dataset stays pending until it matches. |
| Jinyu's CV scores differ from her report | The folds were recomputed. Run her `prepare.py` again rather than creating new folds. |
| The cards stay on "Loading the models" | Open the browser console. Usually `/ort/` or `/models/<slug>/*.onnx` returned 404; run `npm install`, export again if needed, and restart `npm run dev`. |
| `git push` is rejected with `fetch first` | GitHub has commits you do not have (for example a file created on the website). Run `git pull origin main --no-rebase` and push again. Never use `--force` on a shared repository. |
| Port 3000 is already in use | Another `npm run dev` or `preview` is still running. Stop it with Ctrl+C, or open the other address that is printed. |

## Limitations

- Each dataset is a single sample (452, 15,000 and 374 records), so the models may not transfer to other people.
- Sleep efficiency: awakenings almost decide the label at the 85% cut-off. Without awakenings the lifestyle inputs
  reach an F1 of about 0.72, against a baseline of 0.71. Awakenings is recorded on the same night, so the model
  describes the night more than it forecasts it.
- Screen time and stress: stress level carries the models (correlation −0.86 with sleep quality, and the Decision
  Tree's first question at 9.735). Only four of the recorded behaviours are used.
- Sleep health and lifestyle: only 132 of the 374 records are distinct profiles (16 in the test set), and stress level
  carries the tree models.
- Cross-validation folds were also used for tuning, so CV scores are optimistic; the held-out test scores are the
  fairer estimate.
- The outcomes differ by tab (sleep efficiency, sleep quality, sleep duration), so the tabs are not comparable with
  each other.

## Credits and references

- Group 6: Nguyen Minh Khai, Menghan Sun, Jinyu Guo and Zhequan Fu. UTS 36100 Data Science for Innovation.
- Demo video: https://www.youtube.com/watch?v=yBfIcCvLMDw
- Equilibrium. (2023). *Sleep Efficiency Dataset* [Data set]. Kaggle.
  https://www.kaggle.com/datasets/equilibriumm/sleep-efficiency
- Joshi. (2026). *Sleep, Screen Time and Stress Dataset* [Data set]. Kaggle. Full reference as in the group's Stage 2
  report.
- Tharmalingam, L. (2023). *Sleep Health and Lifestyle Dataset* [Data set]. Kaggle.
  https://www.kaggle.com/datasets/uom190346a/sleep-health-and-lifestyle-dataset
- Ohayon, M., Wickwire, E. M., Hirshkowitz, M., et al. (2017). National Sleep Foundation's sleep quality
  recommendations: first report. *Sleep Health, 3*(1), 6–19.
- Rood et al. (2019): source of the sleep quality cut-off used for Screen Time & Stress; full reference in the
  group's Stage 2 report.
- Watson, N. F., Badr, M. S., Belenky, G., et al. (2015). Recommended amount of sleep for a healthy adult: a joint
  consensus statement of the American Academy of Sleep Medicine and Sleep Research Society. *Sleep, 38*(6), 843–844.
- Built with scikit-learn, skl2onnx, ONNX Runtime Web, Next.js, Tailwind CSS and Magic UI
  (https://github.com/magicuidesign/magicui, MIT licence).