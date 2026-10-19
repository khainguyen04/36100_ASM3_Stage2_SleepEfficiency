# ml/export_all.py
"""Export every ready dataset for the web app.

For each ml/datasets/<slug>/config.yaml with status: ready
  1. rebuild the LR / DT / RF pipelines with the locked hyperparameters
  2. check CV and test metrics against the numbers in the Stage 2 report
  3. export ONNX and check ONNX = scikit-learn on the test set
  4. write web/public/models/<slug>/{lr,dt,rf}.onnx + manifest.json and ml/reports/<slug>.json
Finally write web/public/models/registry.json (ready and pending datasets).

Usage:  python ml/export_all.py            or   python ml/export_all.py --only sleep-efficiency
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import yaml

from common import manifest, onnx_export, parity
from common.pipelines import build_pipelines

ROOT = Path(__file__).resolve().parents[1]
DATASETS = ROOT / "ml" / "datasets"
REPORTS = ROOT / "ml" / "reports"
WEB_MODELS = ROOT / "web" / "public" / "models"
SCHEMA = ROOT / "schema" / "manifest.schema.json"
ONNX_TOLERANCE = 1e-5


def export_dataset(cfg, folder):
    slug = cfg["id"]
    train = pd.read_csv(folder / cfg["data"]["train"])
    test = pd.read_csv(folder / cfg["data"]["test"])
    numeric = cfg["features"].get("numeric", [])
    categorical = cfg["features"].get("categorical", [])
    columns, target = numeric + categorical, cfg["target"]["column"]
    X_train, y_train, X_test, y_test = train[columns], train[target], test[columns], test[target]
    splits = parity.cv_splits(train, cfg, y_train)

    out_dir = WEB_MODELS / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("*.onnx"):
        old.unlink()

    tolerance = cfg.get("reference", {}).get("tolerance", 0.002)
    problems, results, fitted, report = [], {}, {}, {"dataset": slug, "models": {}}
    for model_id, pipeline in build_pipelines(cfg).items():
        spec = cfg["models"][model_id]
        cv_mean, cv_sd = parity.cv_f1(pipeline, X_train, y_train, splits)
        pipeline.fit(X_train, y_train)
        proba = pipeline.predict_proba(X_test)[:, 1]
        metrics = {"cvF1": cv_mean, "cvF1Sd": cv_sd, **parity.test_metrics(y_test, proba, spec.get("threshold", 0.5))}
        problems += parity.check_reference(model_id, metrics, cfg.get("reference", {}).get(model_id), tolerance)

        onnx_path = out_dir / f"{model_id}.onnx"
        onnx_inputs = onnx_export.export_onnx(pipeline, numeric, categorical, onnx_path)
        diff = float(np.abs(parity.onnx_probabilities(onnx_path, X_test, numeric, categorical) - proba).max())
        if diff > ONNX_TOLERANCE:
            problems.append(f"{model_id}: ONNX differs from scikit-learn by {diff:.2e}")

        results[model_id], fitted[model_id] = metrics, pipeline
        report["models"][model_id] = {**{k: round(v, 4) for k, v in metrics.items()},
                                      "onnxMaxAbsDiff": diff, "onnxKB": round(onnx_path.stat().st_size / 1024, 1)}
        print(f"  {model_id}: CV F1 {cv_mean:.3f} | test F1 {metrics['testF1']:.3f} | "
              f"ONNX diff {diff:.1e} | {report['models'][model_id]['onnxKB']} KB")

    report["problems"] = problems
    (REPORTS / f"{slug}.json").write_text(json.dumps(report, indent=2))
    if problems:
        return problems
    data = manifest.build_manifest(cfg, train, onnx_inputs, results, fitted)
    manifest.write_manifest(data, SCHEMA, out_dir / "manifest.json")
    return []


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="export a single dataset slug")
    args = parser.parse_args()
    REPORTS.mkdir(exist_ok=True)

    registry, failed = [], []
    configs = [(path, yaml.safe_load(path.read_text())) for path in DATASETS.glob("*/config.yaml")]
    for config_path, cfg in sorted(configs, key=lambda item: item[1].get("order", 99)):
        entry = {"id": cfg["id"], "order": cfg.get("order", 99), "title": cfg["title"], "owner": cfg["owner"]["name"],
                 "target": cfg.get("target", {}).get("label", ""), "status": cfg.get("status", "pending")}
        if entry["status"] == "ready" and (not args.only or args.only == cfg["id"]):
            print(f"\n[{cfg['id']}]")
            problems = export_dataset(cfg, config_path.parent)
            for p in problems:
                print("  PROBLEM:", p)
            if problems:
                failed.append(cfg["id"])
                entry["status"] = "pending"
        elif entry["status"] == "ready" and not (WEB_MODELS / cfg["id"] / "manifest.json").exists():
            entry["status"] = "pending"
        registry.append(entry)

    WEB_MODELS.mkdir(parents=True, exist_ok=True)
    (WEB_MODELS / "registry.json").write_text(json.dumps({"datasets": registry}, indent=2))
    print("\nregistry.json:", ", ".join(f"{d['id']} ({d['status']})" for d in registry))
    if failed:
        print("FAILED:", ", ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    main()