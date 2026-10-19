# ml/common/pipelines.py
"""Rebuild the three Stage 2 pipelines (preprocessing + model) from a dataset config."""
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier

RANDOM_STATE = 42
MODEL_NAMES = {"lr": "Logistic Regression", "dt": "Decision Tree", "rf": "Random Forest"}
SK_GE_18 = tuple(int(x) for x in sklearn.__version__.split(".")[:2]) >= (1, 8)


def build_preprocessor(cfg, scale):
    """Median imputation (+ scaling) for numeric columns; imputation + one-hot for categorical columns."""
    prep = cfg.get("preprocessing", {})
    numeric = cfg["features"].get("numeric", [])
    categorical = cfg["features"].get("categorical", [])

    numeric_steps = [("impute", SimpleImputer(strategy=prep.get("numeric_impute", "median")))]
    if scale:
        numeric_steps.append(("scale", StandardScaler()))
    transformers = [("num", Pipeline(numeric_steps), numeric)]

    if categorical:
        cat_impute = prep.get("categorical_impute", {"strategy": "most_frequent"})
        onehot = prep.get("onehot", {"drop": "if_binary"})
        transformers.append(("cat", Pipeline([
            ("impute", SimpleImputer(**cat_impute)),
            ("onehot", OneHotEncoder(**onehot)),
        ]), categorical))
    return ColumnTransformer(transformers)


def make_model(model_id, params):
    params = dict(params or {})
    if model_id == "lr":
        # scikit-learn 1.8+ replaces `penalty` with `l1_ratio` (0 = L2, 1 = L1)
        if SK_GE_18 and "penalty" in params:
            params["l1_ratio"] = {"l2": 0.0, "l1": 1.0}[params.pop("penalty")]
        return LogisticRegression(random_state=RANDOM_STATE, **params)
    if model_id == "dt":
        return DecisionTreeClassifier(random_state=RANDOM_STATE, **params)
    if model_id == "rf":
        return RandomForestClassifier(random_state=RANDOM_STATE, n_jobs=1, **params)
    raise ValueError(f"Unknown model id: {model_id}")


def build_pipelines(cfg):
    """Return {model_id: Pipeline} for every model listed in the config."""
    scale_for = cfg.get("preprocessing", {}).get("scale_for", ["lr"])
    return {
        model_id: Pipeline([
            ("preprocessor", build_preprocessor(cfg, scale=model_id in scale_for)),
            ("model", make_model(model_id, spec.get("params"))),
        ])
        for model_id, spec in cfg["models"].items()
    }