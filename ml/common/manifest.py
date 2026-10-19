# ml/common/manifest.py
"""Build manifest.json (everything the web app needs to draw one dataset tab)."""
import json

import jsonschema
import numpy as np

from .pipelines import MODEL_NAMES


def _clean(names):
    return [name.split("__", 1)[1] for name in names]


def build_features(cfg, train, onnx_inputs):
    """ONNX inputs in order, where each one comes from (an input key or an adapter) and its training range."""
    numeric = cfg["features"].get("numeric", [])
    categorical = cfg["features"].get("categorical", [])
    fed_by = {item["feature"]: item["key"] for item in cfg["inputs"] if item.get("feature")}
    features = []
    for name, onnx_name in zip(numeric + categorical, onnx_inputs):
        feature = {"name": name, "onnxInput": onnx_name,
                   "dtype": "float32" if name in numeric else "string",
                   "from": fed_by.get(name, "adapter")}
        if name in numeric:
            feature["trainingRange"] = [float(train[name].min()), float(train[name].max())]
        else:
            feature["categories"] = sorted(train[name].dropna().astype(str).unique().tolist())
        features.append(feature)
    return features


def build_insights(fitted):
    """LR coefficients and odds ratios, RF importances and the Decision Tree root split."""
    insights = {}
    if "lr" in fitted:
        lr = fitted["lr"]
        names = _clean(lr.named_steps["preprocessor"].get_feature_names_out())
        coefs = lr.named_steps["model"].coef_[0]
        insights["lrCoefficients"] = sorted(
            [{"feature": n, "coef": round(float(c), 4), "oddsRatio": round(float(np.exp(c)), 4)}
             for n, c in zip(names, coefs)], key=lambda d: -abs(d["coef"]))
    if "rf" in fitted:
        rf = fitted["rf"]
        names = _clean(rf.named_steps["preprocessor"].get_feature_names_out())
        insights["rfImportances"] = sorted(
            [{"feature": n, "importance": round(float(v), 4)}
             for n, v in zip(names, rf.named_steps["model"].feature_importances_)], key=lambda d: -d["importance"])
    if "dt" in fitted:
        dt = fitted["dt"]
        names = _clean(dt.named_steps["preprocessor"].get_feature_names_out())
        tree, model = dt.named_steps["model"].tree_, dt.named_steps["model"]
        left, right = tree.children_left[0], tree.children_right[0]
        n = tree.n_node_samples
        child_impurity = (n[left] * tree.impurity[left] + n[right] * tree.impurity[right]) / n[0]
        insights["dtRootSplit"] = {"feature": names[tree.feature[0]], "threshold": round(float(tree.threshold[0]), 4),
                                   "criterion": model.criterion,
                                   "impurityDecrease": round(float(tree.impurity[0] - child_impurity), 4)}
    return insights


def build_manifest(cfg, train, onnx_inputs, model_results, fitted):
    target = {k: v for k, v in cfg["target"].items() if k != "column"}
    target.setdefault("prevalence", round(float(train[cfg["target"]["column"]].mean()), 4))  # config may give the full-data rate
    models = []
    for model_id, spec in cfg["models"].items():
        models.append({
            "id": model_id, "name": MODEL_NAMES[model_id], "file": f"{model_id}.onnx",
            "threshold": spec.get("threshold", 0.5), "params": spec.get("params", {}),
            "metrics": {k: (None if v is None else round(v, 4)) for k, v in model_results[model_id].items()},
            "recommended": bool(spec.get("recommended", False)), "highestF1": bool(spec.get("highestF1", False)),
        })
    return {
        "id": cfg["id"], "title": cfg["title"], "owner": cfg["owner"], "source": cfg["source"],
        "n": int(cfg.get("n", 0)), "target": target,
        "inputs": cfg["inputs"], "features": build_features(cfg, train, onnx_inputs),
        "models": models, "insights": build_insights(fitted),
        "evaluationNote": cfg.get("evaluationNote", ""), "limitations": cfg.get("limitations", []),
    }


def write_manifest(manifest, schema_path, out_path):
    jsonschema.validate(manifest, json.loads(schema_path.read_text()))
    out_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))