"""Rebuild Jinyu Guo's Stage 2 train/test data from the original Kaggle file.

Follows her notebook: merge "Normal Weight" into "Normal", split Blood Pressure into Systolic and
Diastolic BP, target = Sleep Duration < 7 h, group identical predictor profiles, GroupShuffleSplit
(test_size 0.2, random_state 42) -> 295 train / 79 test rows.

Her 10 CV folds came from StratifiedGroupKFold(shuffle=True, random_state=42) on scikit-learn 1.6,
whose shuffling differs in newer versions, so the fold of each training row is stored below.

Usage:  python ml/datasets/sleep-lifestyle/prepare.py
"""
from pathlib import Path

import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

HERE = Path(__file__).resolve().parent
RAW = HERE / "data" / "raw" / "Sleep_health_and_lifestyle_dataset.csv"
FEATURES = ["Age", "Gender", "Occupation", "Physical Activity Level", "Stress Level", "BMI Category",
            "Systolic BP", "Diastolic BP", "Heart Rate", "Daily Steps"]
FOLDS = (  # fold (0-9) of each training row, in row order
    "22229111616666262888888888880044422414414414444448555555555"
    "55338827333333244444444442429947474777777777773666666669935"
    "59999999999667746114444444455555550505000000000088022222222"
    "22222222122777777777777759500000000000949999999999999999990"
    "00033388833333333333333333111111177667777773333333333333333"
)
FOLD_SIZES = [30, 17, 30, 46, 38, 24, 19, 37, 19, 35]  # validation sizes in Jinyu's fold table

df = pd.read_csv(RAW)
df["BMI Category"] = df["BMI Category"].replace({"Normal Weight": "Normal"})
bp = df["Blood Pressure"].str.split("/", expand=True)
df["Systolic BP"], df["Diastolic BP"] = pd.to_numeric(bp[0]), pd.to_numeric(bp[1])
df["Poor Sleep"] = (df["Sleep Duration"] < 7).astype(int)

data = df[FEATURES + ["Poor Sleep"]].copy()
data["group_id"] = data[FEATURES].groupby(FEATURES, dropna=False, sort=False).ngroup()
train_idx, test_idx = next(GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
                           .split(data, data["Poor Sleep"], data["group_id"]))
train, test = data.iloc[train_idx].copy(), data.iloc[test_idx].copy()
train["cv_fold"] = [int(c) for c in FOLDS]

assert (len(train), len(test)) == (295, 79), "split differs from Jinyu's notebook"
assert train["cv_fold"].value_counts().sort_index().tolist() == FOLD_SIZES, "fold sizes differ"
assert train.groupby("group_id")["cv_fold"].nunique().max() == 1, "a profile is split across folds"
train.to_csv(HERE / "data" / "train.csv", index=False)
test.to_csv(HERE / "data" / "test.csv", index=False)
print(f"train {len(train)} rows ({train['group_id'].nunique()} profiles), test {len(test)} rows "
      f"({test['group_id'].nunique()} profiles), short sleep {data['Poor Sleep'].mean():.1%} overall")
