# Adding your dataset to the app (teammates)

Your tab already exists and shows "coming soon". To make it live:

1. **Send the processed data** used for your final models: the training and test rows exactly as they went into the
   models (after cleaning, before encoding/scaling), with the target column. Put them in
   `ml/datasets/<your-slug>/data/train.csv` and `test.csv`.
2. **Confirm your final settings** (copied from the report into `ml/datasets/<your-slug>/config.yaml`):
   - predictors and their types (numeric / ordinal / categorical);
   - preprocessing (imputation, scaling, encoding, class weights);
   - the selected hyperparameters for LR, DT and RF, and any custom threshold;
   - the metrics you report (CV F1 and/or test F1, accuracy, precision, recall).
3. **Write the UI texts** in the same `config.yaml`: a label, help text and unit for every input, the target definition
   and citation, and 2–3 limitations.
4. Set `status: ready` and run `python ml/export_all.py`. It rebuilds your three pipelines, checks that the rebuilt models
   reproduce your reported metrics, exports ONNX, verifies ONNX = scikit-learn, and writes your `manifest.json`.
5. Only if an input needs converting before it reaches the model (e.g. a time picker or "126/83" blood pressure),
   add an adapter in `web/src/lib/adapters/<your-slug>.ts`.

| Slug | Owner | Note |
|---|---|---|
| `screen-stress` | Menghan Sun | 4 numeric inputs, no adapter needed |
| `sleep-lifestyle` | Jinyu Guo | blood pressure input → Systolic BP + Diastolic BP (adapter); BMI "Normal Weight" merged into "Normal" |
| `nhanes-work` | Zhequan Fu | NHANES codes need readable labels (gender, education); LR threshold 0.45; class weights |
