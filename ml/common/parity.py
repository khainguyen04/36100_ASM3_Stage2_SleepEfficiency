# ml/common/parity.py
"""Metrics for the rebuilt models and the ONNX vs scikit-learn parity check."""
import numpy as np
import onnxruntime as ort
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import StratifiedKFold, cross_val_score


def cv_splits(train, cfg, y):
    """Use the saved fold column when the data has one (same folds as the report), else stratified 10-fold."""
    fold_col = cfg.get("data", {}).get("cv_fold_column")
    if fold_col and fold_col in train.columns:
        folds = train[fold_col].to_numpy()
        return [(np.flatnonzero(folds != k), np.flatnonzero(folds == k)) for k in sorted(set(folds))]
    return list(StratifiedKFold(10, shuffle=True, random_state=42).split(train, y))


def cv_f1(pipeline, X, y, splits):
    scores = cross_val_score(pipeline, X, y, cv=splits, scoring="f1")
    return float(scores.mean()), float(scores.std(ddof=1))


def test_metrics(y_true, proba, threshold):
    y_pred = (proba >= threshold).astype(int)
    return {
        "testF1": f1_score(y_true, y_pred, zero_division=0),
        "testAccuracy": accuracy_score(y_true, y_pred),
        "testPrecision": precision_score(y_true, y_pred, zero_division=0),
        "testRecall": recall_score(y_true, y_pred, zero_division=0),
    }


def onnx_probabilities(path, X, numeric, categorical):
    """Run the ONNX file on a DataFrame and return P(class 1) for each row."""
    session = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    feed = {}
    for graph_input, column in zip(session.get_inputs(), numeric + categorical):
        values = X[[column]]
        feed[graph_input.name] = (values.to_numpy(np.float32) if column in numeric
                                  else values.astype(str).to_numpy())
    _, probabilities = session.run(None, feed)
    return probabilities[:, 1]


def check_reference(name, computed, reference, tolerance):
    """Compare rebuilt metrics with the numbers reported in Stage 2. Returns a list of problems."""
    problems = []
    for key, expected in (reference or {}).items():
        actual = computed.get(key)
        if actual is None or abs(actual - expected) > tolerance:
            problems.append(f"{name} {key}: expected {expected}, got {actual if actual is None else round(actual, 4)}")
    return problems