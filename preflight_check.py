import os
import sys
import math
import csv

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

    try:
        import numpy as np
        import pandas as pd
        df = pd.read_csv(sub_path)

        # 2. Header and column order check
        if list(df.columns) != REQUIRED_COLS:
            raise ValueError(
                f"Header mismatch!\nExpected: {REQUIRED_COLS}\nGot: {list(df.columns)}"
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
                f"Probabilities out of range [0.0, 1.0]! (Min: {min_val}, Max: {max_val})"
            )
        print(f"  ✔ Probabilities properly bounded: [{min_val:.4f}, {max_val:.4f}]")

        # 6. Dead-head distribution check
        stds = df.iloc[:, 1:].std()
        flat_targets = stds[stds == 0].index.tolist()
        if flat_targets:
            print(f"  ⚠ Warning: Zero variance detected on targets: {flat_targets}")
        else:
            print("  ✔ All 12 prediction targets have active distributions.")

    except ImportError:
        # Fallback pure-python csv reader
        with open(sub_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            if header != REQUIRED_COLS:
                raise ValueError(f"Header mismatch!\nExpected: {REQUIRED_COLS}\nGot: {header}")
            print("  ✔ Columns & order exact match.")

            rows = list(reader)
            if not rows:
                raise ValueError("Submission file is empty!")

            min_val, max_val = 1.0, 0.0
            col_values = {c: [] for c in REQUIRED_COLS[1:]}

            for row_idx, r in enumerate(rows):
                if len(r) != len(REQUIRED_COLS):
                    raise ValueError(f"Row {row_idx} length mismatch: got {len(r)}, expected {len(REQUIRED_COLS)}")
                for c_idx, val_str in enumerate(r[1:], 1):
                    try:
                        val = float(val_str)
                    except ValueError:
                        raise ValueError(f"Invalid numeric value '{val_str}' at row {row_idx}, col {REQUIRED_COLS[c_idx]}")
                    
                    if math.isnan(val) or math.isinf(val):
                        raise ValueError(f"NaN or Inf at row {row_idx}, col {REQUIRED_COLS[c_idx]}")
                    if val < 0.0 or val > 1.0:
                        raise ValueError(f"Probability out of range [0, 1] at row {row_idx}, col {REQUIRED_COLS[c_idx]}: {val}")
                    
                    min_val = min(min_val, val)
                    max_val = max(max_val, val)
                    col_values[REQUIRED_COLS[c_idx]].append(val)

            print("  ✔ Zero NaN / Inf detected.")
            print(f"  ✔ Probabilities properly bounded: [{min_val:.4f}, {max_val:.4f}]")

            # Check variance per column
            flat_targets = []
            for col, vals in col_values.items():
                mean = sum(vals) / len(vals)
                variance = sum((v - mean) ** 2 for v in vals) / len(vals)
                if variance == 0.0:
                    flat_targets.append(col)

            if flat_targets:
                print(f"  ⚠ Warning: Zero variance detected on targets: {flat_targets}")
            else:
                print("  ✔ All 12 prediction targets have active distributions.")

    print(
        "\n[SUCCESS] submission.csv passed all preflight checks and is ready for scoring."
    )


if __name__ == "__main__":
    test_file = (
        "/kaggle/input/rsna-knee-abnormality-detection/test.csv"
        if os.path.exists("/kaggle/input/rsna-knee-abnormality-detection/test.csv")
        else None
    )
    run_preflight_check("submission.csv", test_csv_path=test_file)
