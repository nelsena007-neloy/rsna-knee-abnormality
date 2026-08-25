import os
import sys
import numpy as np
import pandas as pd

REQUIRED_COLS = [
    "StudyInstanceUID",
    "ACL",
    "MCL",
    "Medial Meniscus",
    "Lateral Meniscus",
    "Medial OA",
    "Lateral OA",
    "PF OA",
    "Effusion",
    "Synovitis",
    "Baker's",
    "Contusion",
    "Fracture",
]


def run_preflight_check(sub_path="submission.csv", test_csv_path=None):
  print("[*] Running RSNA Pre-Submission Quality Gate...")

  # 1. Existence check
  if not os.path.exists(sub_path):
    raise FileNotFoundError(f"Missing submission artifact: {sub_path}")

  df = pd.read_csv(sub_path)

  # 2. Header and column order check
  if list(df.columns) != REQUIRED_COLS:
    raise ValueError(
        f"Header mismatch!\nExpected: {REQUIRED_COLS}\nGot:     "
        f" {list(df.columns)}"
    )
  print("  ✔ Columns & order exact match.")

  # 3. Row count check against test.csv
  if test_csv_path and os.path.exists(test_csv_path):
    test_df = pd.read_csv(test_csv_path)
    if len(df) != len(test_df):
      raise ValueError(
          f"Row count mismatch: Expected {len(test_df)} rows, found {len(df)}"
      )
    print(f"  ✔ Row count matched test set ({len(df)} cases).")

  # 4. Null / NaN / Inf validation
  if df.isna().any().any() or np.isinf(df.iloc[:, 1:].values).any():
    raise ValueError("Found NaN or Inf values in prediction matrix!")
  print("  ✔ Zero NaN / Inf detected.")

  # 5. Probability value range validation
  numeric_vals = df.iloc[:, 1:].values
  min_val, max_val = numeric_vals.min(), numeric_vals.max()
  if min_val < 0.0 or max_val > 1.0:
    raise ValueError(
        f"Probabilities out of range [0.0, 1.0]! (Min: {min_val}, Max:"
        f" {max_val})"
    )
  print(f"  ✔ Probabilities properly bounded: [{min_val:.4f}, {max_val:.4f}]")

  # 6. Dead-head distribution check
  stds = df.iloc[:, 1:].std()
  flat_targets = stds[stds == 0].index.tolist()
  if flat_targets:
    print(f"  ⚠ Warning: Zero variance detected on targets: {flat_targets}")
  else:
    print("  ✔ All 12 prediction targets have active distributions.")

  print(
      "\n[SUCCESS] submission.csv passed all preflight checks and is ready for"
      " scoring."
  )


if __name__ == "__main__":
  test_file = (
      "/kaggle/input/rsna-knee-abnormality-detection/test.csv"
      if os.path.exists("/kaggle/input/rsna-knee-abnormality-detection/test.csv")
      else None
  )
  run_preflight_check("submission.csv", test_csv_path=test_file)
