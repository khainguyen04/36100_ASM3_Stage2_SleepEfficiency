"""Rebuild Menghan Sun's Stage 2 train/test data from the original Kaggle file.

Follows her notebook: target = sleep_quality_score <= 5, four predictors chosen in Stage 1,
stratified 80/20 split with random_state 42 -> 12,000 train / 3,000 test rows. Her 10 CV folds are
StratifiedKFold(10, shuffle=True, random_state=42) on the training rows in this order, which is what
ml/common/parity.py uses when the data has no fold column.

Usage:  python ml/datasets/screen-stress/prepare.py
"""
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

HERE = Path(__file__).resolve().parent
RAW = HERE / "data" / "raw" / "sleep_mobile_stress_dataset_15000.csv"
FEATURES = ["stress_level", "daily_screen_time_hours", "phone_usage_before_sleep_minutes", "mental_fatigue_score"]

df = pd.read_csv(RAW)
df["poor_sleep"] = (df["sleep_quality_score"] <= 5).astype(int)

data = df[FEATURES + ["poor_sleep"]]
train, test = train_test_split(data, test_size=0.20, stratify=data["poor_sleep"], random_state=42)

assert len(df) == 15000 and df["poor_sleep"].sum() == 3760, "not the 15,000-row file from Menghan's notebook"
assert (len(train), len(test)) == (12000, 3000), "split differs from Menghan's notebook"
train.to_csv(HERE / "data" / "train.csv", index=False)
test.to_csv(HERE / "data" / "test.csv", index=False)
print(f"train {len(train)} rows, test {len(test)} rows, poor sleep {df['poor_sleep'].mean():.2%} overall")
